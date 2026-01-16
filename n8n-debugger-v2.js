#!/usr/bin/env node
/**
 * n8n Workflow Debugger v2
 * Run this script on your local machine to debug and fix the workflow
 *
 * Usage: node n8n-debugger-v2.js
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

  // Clean the workflow object - remove read-only fields that API doesn't accept
  const cleanWorkflow = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    active: workflow.active,
    settings: workflow.settings,
    tags: workflow.tags || []
  };

  return await makeRequest('PUT', `/api/v1/workflows/${CONFIG.WORKFLOW_ID}`, cleanWorkflow);
}

async function getExecutions(limit = 5) {
  console.log('📊 Fetching recent executions...');
  return await makeRequest('GET', `/api/v1/executions?workflowId=${CONFIG.WORKFLOW_ID}&limit=${limit}`);
}

async function diagnoseWorkflow() {
  console.log('\n🔍 n8n WORKFLOW DEBUGGER v2\n' + '='.repeat(50));

  const workflow = await getWorkflow();
  console.log(`✅ Found workflow: ${workflow.name}`);
  console.log(`   Nodes: ${workflow.nodes.length}`);

  // Check Normalize Client Data node
  const normalizeNode = workflow.nodes.find(n => n.name === 'Normalize Client Data');
  if (normalizeNode) {
    const managerIdField = normalizeNode.parameters.assignments?.assignments?.find(a => a.name === 'manager_id');
    if (managerIdField) {
      console.log(`\n📋 manager_id field:`);
      console.log(`   Value: ${JSON.stringify(managerIdField.value)}`);

      // Check for \n
      if (managerIdField.value.includes('\\n')) {
        console.log('   ⚠️  WARNING: Contains \\n character!');
      } else {
        console.log('   ✅ No \\n character');
      }
    }
  }

  // Check Google Ads API nodes for headers
  const apiNodes = ['Fetch Campaign Data', 'Fetch Keyword Data', 'Fetch Ad Data', 'Fetch Search Terms'];
  console.log(`\n🔌 Checking Google Ads API nodes:`);

  apiNodes.forEach(nodeName => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    if (node) {
      const hasHeaders = node.parameters.sendHeaders === true;
      const hasLoginCustomerId = node.parameters.headerParameters?.parameters?.some(
        p => p.name === 'login-customer-id'
      );

      console.log(`   ${nodeName}:`);
      console.log(`     Send Headers: ${hasHeaders ? '✅' : '❌'}`);
      console.log(`     login-customer-id: ${hasLoginCustomerId ? '✅' : '❌'}`);

      if (hasLoginCustomerId) {
        const header = node.parameters.headerParameters.parameters.find(p => p.name === 'login-customer-id');
        console.log(`     Header value: ${header.value}`);
      }
    }
  });

  // Check recent executions
  try {
    const executions = await getExecutions(3);
    console.log(`\n📊 Recent executions: ${executions.data?.length || 0}`);

    if (executions.data && executions.data.length > 0) {
      const latest = executions.data[0];
      console.log(`   Latest: ${latest.finished ? '✅ Finished' : latest.stoppedAt ? '❌ Failed' : '⏳ Running'}`);
      if (latest.stoppedAt && !latest.finished) {
        console.log(`   Error: Check n8n UI for details`);
      }
    }
  } catch (e) {
    console.log(`\n⚠️  Could not fetch executions: ${e.message}`);
  }

  return workflow;
}

async function fixWorkflow(workflow) {
  console.log('\n🔧 APPLYING FIXES\n' + '='.repeat(50));
  let changesMade = false;

  // Fix 1: manager_id field
  const normalizeNode = workflow.nodes.find(n => n.name === 'Normalize Client Data');
  if (normalizeNode) {
    const managerIdField = normalizeNode.parameters.assignments?.assignments?.find(a => a.name === 'manager_id');
    if (managerIdField) {
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

    // Ensure manager_id is in the return
    if (!newCode.includes('manager_id: managerId')) {
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
      const needsHeaders = !node.parameters.sendHeaders || !node.parameters.headerParameters?.parameters?.some(p => p.name === 'login-customer-id');

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
        console.log(`✅ Added login-customer-id header to ${nodeName}`);
        changesMade = true;
      }
    }
  });

  if (!changesMade) {
    console.log('ℹ️  No changes needed - workflow already correct');
    return false;
  }

  return changesMade;
}

async function main() {
  try {
    const workflow = await diagnoseWorkflow();

    console.log('\n' + '='.repeat(50));

    rl.question('\n❓ Would you like to apply fixes? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        const changed = await fixWorkflow(workflow);

        if (changed) {
          try {
            await updateWorkflow(workflow);
            console.log('\n✅ Workflow updated successfully!');
            console.log('\n🎯 Next steps:');
            console.log('1. Go to n8n and refresh the workflow page (F5)');
            console.log('2. Click "Execute Workflow"');
            console.log('3. Check if the Google Ads API calls succeed');
            console.log('\n💡 The fixes have been applied to your workflow!');
          } catch (error) {
            console.error('\n❌ Error updating workflow:', error.message);
            console.log('\n🔍 Debug info:');
            console.log('This might be a temporary API issue. Please try again.');
          }
        }
      } else {
        console.log('\nℹ️  No changes made');
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
