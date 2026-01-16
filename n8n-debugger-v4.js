#!/usr/bin/env node
/**
 * n8n Workflow Debugger v4 - FINAL VERSION
 * Run this script on your local machine to debug and fix the workflow
 *
 * Usage: node n8n-debugger-v4.js
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CONFIG = {
  N8N_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjU2ZmIyOC1iYzljLTQzNjMtYjYzNS0zOWE0MzNiNzI4N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4NTYxNzcxLCJleHAiOjE3NzExMDY0MDB9.ZHw_n_i30zY4jenB7FqwjjX5Gl9swydMx14H0vp2D4g',
  N8N_HOST: 'syte.app.n8n.cloud',
  WORKFLOW_ID: 'AOB1xj8dgTixSyTh'
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.N8N_HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-N8N-API-KEY': CONFIG.N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getWorkflow() {
  console.log('📥 Fetching workflow...');
  return await makeRequest('GET', `/api/v1/workflows/${CONFIG.WORKFLOW_ID}`);
}

async function updateWorkflow(workflow) {
  console.log('📤 Updating workflow...');

  // Clean the workflow object - ONLY send fields that are writable
  const cleanWorkflow = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  // Optionally include staticData if it exists
  if (workflow.staticData !== undefined && workflow.staticData !== null) {
    cleanWorkflow.staticData = workflow.staticData;
  }

  return await makeRequest('PUT', `/api/v1/workflows/${CONFIG.WORKFLOW_ID}`, cleanWorkflow);
}

async function diagnoseWorkflow() {
  console.log('\n🔍 n8n WORKFLOW DEBUGGER v4 (FINAL)\n' + '='.repeat(50));

  const workflow = await getWorkflow();
  console.log(`✅ Found workflow: ${workflow.name}`);
  console.log(`   Nodes: ${workflow.nodes.length}`);

  // Check Normalize Client Data node
  const normalizeNode = workflow.nodes.find(n => n.name === 'Normalize Client Data');
  if (normalizeNode) {
    console.log(`\n📋 Normalize Client Data node:`);
    const managerIdField = normalizeNode.parameters.assignments?.assignments?.find(a => a.name === 'manager_id');
    if (managerIdField) {
      console.log(`   ✅ manager_id field exists`);
      console.log(`   Value: ${JSON.stringify(managerIdField.value)}`);
      if (managerIdField.value.includes('\\n')) {
        console.log('   ⚠️  Contains \\n character!');
      }
    } else {
      console.log(`   ❌ manager_id field MISSING - will create it`);
    }
  }

  // Check Prepare Google Ads Queries node
  const prepareNode = workflow.nodes.find(n => n.name === 'Prepare Google Ads Queries');
  if (prepareNode) {
    console.log(`\n📝 Prepare Google Ads Queries:`);
    const usesManagerId = prepareNode.parameters.jsCode?.includes('manager_id: managerId');
    const usesOldManagerId = prepareNode.parameters.jsCode?.includes('item.json["Manager ID"]');

    if (usesManagerId && !usesOldManagerId) {
      console.log('   ✅ Correctly passes manager_id');
    } else if (usesOldManagerId) {
      console.log('   ⚠️  Uses old Manager ID reference - will fix');
    } else {
      console.log('   ❌ Does not pass manager_id - will fix');
    }
  }

  // Check Google Ads API nodes for headers
  const apiNodes = ['Fetch Campaign Data', 'Fetch Keyword Data', 'Fetch Ad Data', 'Fetch Search Terms'];
  console.log(`\n🔌 Google Ads API nodes:`);

  apiNodes.forEach(nodeName => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    if (node) {
      const hasHeaders = node.parameters.sendHeaders === true;
      const hasLoginCustomerId = node.parameters.headerParameters?.parameters?.some(
        p => p.name === 'login-customer-id'
      );

      const status = hasHeaders && hasLoginCustomerId ? '✅' : '❌';
      console.log(`   ${status} ${nodeName}`);
    }
  });

  return workflow;
}

async function fixWorkflow(workflow) {
  console.log('\n🔧 APPLYING FIXES\n' + '='.repeat(50));
  let changesMade = false;

  // Fix 1: manager_id field - CREATE it if missing
  const normalizeNode = workflow.nodes.find(n => n.name === 'Normalize Client Data');
  if (normalizeNode) {
    if (!normalizeNode.parameters.assignments) {
      normalizeNode.parameters.assignments = { assignments: [] };
    }
    if (!normalizeNode.parameters.assignments.assignments) {
      normalizeNode.parameters.assignments.assignments = [];
    }

    let managerIdField = normalizeNode.parameters.assignments.assignments.find(a => a.name === 'manager_id');

    if (!managerIdField) {
      // CREATE the field if it doesn't exist
      normalizeNode.parameters.assignments.assignments.push({
        id: 'manager_id',
        name: 'manager_id',
        value: "={{ String($json['Manager ID']).replace(/[^0-9]/g, '') }}",
        type: 'string'
      });
      console.log('✅ Created manager_id field');
      changesMade = true;
    } else {
      // Fix existing field
      const oldValue = managerIdField.value;
      managerIdField.value = "={{ String($json['Manager ID']).replace(/[^0-9]/g, '') }}";
      if (oldValue !== managerIdField.value) {
        console.log('✅ Fixed manager_id expression');
        changesMade = true;
      }
    }
  }

  // Fix 2: Prepare Google Ads Queries
  const prepareNode = workflow.nodes.find(n => n.name === 'Prepare Google Ads Queries');
  if (prepareNode && prepareNode.parameters.jsCode) {
    const oldCode = prepareNode.parameters.jsCode;

    // Fix the JavaScript to use manager_id instead of Manager ID
    let newCode = oldCode.replace(
      /const managerId = item\.json\["Manager ID"\];?/g,
      'const managerId = item.json.manager_id;'
    );

    // Ensure manager_id is in the return - replace the spread operator approach
    if (newCode.includes('...item.json,')) {
      newCode = newCode.replace(
        /return \{\s*json: \{\s*\.\.\.item\.json,/,
        'return {\n    json: {\n      account_id: item.json.account_id,\n      account_name: item.json.account_name,\n      target_cpl: item.json.target_cpl,\n      weekly_budget: item.json.weekly_budget,\n      campaign_ids: item.json.campaign_ids,\n      manager_id: managerId,'
      );
    }

    if (oldCode !== newCode) {
      prepareNode.parameters.jsCode = newCode;
      console.log('✅ Fixed Prepare Google Ads Queries');
      changesMade = true;
    }
  }

  // Fix 3: Add headers to Google Ads API nodes
  const apiNodes = ['Fetch Campaign Data', 'Fetch Keyword Data', 'Fetch Ad Data', 'Fetch Search Terms'];
  apiNodes.forEach(nodeName => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    if (node) {
      const needsHeaders = !node.parameters.sendHeaders ||
                          !node.parameters.headerParameters?.parameters?.some(p => p.name === 'login-customer-id');

      if (needsHeaders) {
        node.parameters.sendHeaders = true;
        node.parameters.headerParameters = {
          parameters: [
            {
              name: 'login-customer-id',
              value: nodeName === 'Fetch Campaign Data'
                ? '={{ $json.manager_id }}'
                : "={{ $('Prepare Google Ads Queries').item.json.manager_id }}"
            }
          ]
        };
        console.log(`✅ Added login-customer-id to ${nodeName}`);
        changesMade = true;
      }
    }
  });

  if (!changesMade) {
    console.log('ℹ️  Workflow is already correctly configured!');
    return false;
  }

  return changesMade;
}

async function main() {
  try {
    const workflow = await diagnoseWorkflow();

    console.log('\n' + '='.repeat(50));

    rl.question('\n❓ Apply all fixes? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        const changed = await fixWorkflow(workflow);

        if (changed) {
          try {
            await updateWorkflow(workflow);
            console.log('\n🎉 SUCCESS! WORKFLOW FIXED!\n');
            console.log('='.repeat(50));
            console.log('✅ All changes applied successfully!');
            console.log('='.repeat(50));
            console.log('\n📝 What was fixed:');
            console.log('   ✅ manager_id field created/fixed in Normalize Client Data');
            console.log('   ✅ Prepare Google Ads Queries updated to use manager_id');
            console.log('   ✅ login-customer-id headers added to all 4 API nodes');
            console.log('\n🎯 NEXT STEPS:');
            console.log('   1. Open your n8n workflow in the browser');
            console.log('   2. Press F5 to refresh');
            console.log('   3. Click "Execute Workflow"');
            console.log('   4. Watch it succeed! 🚀\n');
            console.log('='.repeat(50));
          } catch (error) {
            console.error('\n❌ Update failed:', error.message);

            if (error.message.includes('read-only')) {
              console.log('\n🔍 Another read-only field found!');
              console.log('Please share this error so I can create v5.');
            } else {
              console.log('\n💡 Try running the script again.');
            }
          }
        }
      } else {
        console.log('\nNo changes made.');
      }

      rl.close();
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
