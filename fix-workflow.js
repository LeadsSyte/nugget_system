#!/usr/bin/env node

const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjU2ZmIyOC1iYzljLTQzNjMtYjYzNS0zOWE0MzNiNzI4N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4NTYxNzcxLCJleHAiOjE3NzExMDY0MDB9.ZHw_n_i30zY4jenB7FqwjjX5Gl9swydMx14H0vp2D4g';
const WORKFLOW_ID = 'AOB1xj8dgTixSyTh';
const N8N_HOST = 'syte.app.n8n.cloud';

// Function to make HTTPS request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: N8N_HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

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

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function fixWorkflow() {
  try {
    console.log('📥 Fetching current workflow...');
    const workflow = await makeRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`);

    console.log('🔧 Applying fixes...');

    // Fix 1: Update manager_id field in Normalize Client Data node
    const normalizeNode = workflow.nodes.find(n => n.name === 'Normalize Client Data');
    if (normalizeNode) {
      const managerIdField = normalizeNode.parameters.assignments.assignments.find(
        a => a.name === 'manager_id'
      );
      if (managerIdField) {
        // Remove the \n and improve the expression
        managerIdField.value = "={{ String($json['Manager ID'] || '').replace(/[^0-9]/g, '') }}";
        console.log('  ✅ Fixed manager_id expression');
      }
    }

    // Fix 2: Update Prepare Google Ads Queries JavaScript
    const prepareNode = workflow.nodes.find(n => n.name === 'Prepare Google Ads Queries');
    if (prepareNode) {
      prepareNode.parameters.jsCode = prepareNode.parameters.jsCode
        .replace('const managerId = item.json["Manager ID"];', 'const managerId = item.json.manager_id;')
        .replace('...item.json,', 'account_id: item.json.account_id,\n      account_name: item.json.account_name,\n      target_cpl: item.json.target_cpl,\n      weekly_budget: item.json.weekly_budget,\n      campaign_ids: item.json.campaign_ids,\n      manager_id: managerId,');
      console.log('  ✅ Fixed Prepare Google Ads Queries');
    }

    // Fix 3: Add login-customer-id headers to all Google Ads API nodes
    const apiNodes = [
      'Fetch Campaign Data',
      'Fetch Keyword Data',
      'Fetch Ad Data',
      'Fetch Search Terms'
    ];

    apiNodes.forEach(nodeName => {
      const node = workflow.nodes.find(n => n.name === nodeName);
      if (node) {
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
        console.log(`  ✅ Added header to ${nodeName}`);
      }
    });

    console.log('📤 Uploading fixed workflow...');
    await makeRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, workflow);

    console.log('✅ Workflow fixed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Go to n8n and refresh the workflow');
    console.log('2. Execute the workflow');
    console.log('3. All Google Ads API calls should now work!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixWorkflow();
