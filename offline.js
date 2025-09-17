<!doctype html>
<html>
 <head>
  <title>WhatsApp Message Sender</title>
  <style>
        body {
            background: #0a0a2a;
            color: #e0e0ff;
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .box {
            background: rgba(10,20,40,0.8);
            padding: 20px;
            border-radius: 10px;
            margin: 20px auto;
            border: 1px solid #4d4dff;
        }
        input, button, select {
            display: block;
            margin: 10px auto;
            padding: 10px;
            width: 90%;
            max-width: 400px;
            border-radius: 5px;
            border: 2px solid #4deeea;
            background: rgba(10,15,30,0.8);
            color: #e0e0ff;
        }
        button {
            background: #4deeea;
            color: #0a0a2a;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }
        a {
            color: #4deeea;
            text-decoration: none;
        }
        .pairing-result {
            margin-top: 20px;
            padding: 15px;
            background: rgba(20,40,80,0.8);
            border-radius: 10px;
            border: 1px solid #4deeea;
            display: none;
        }
        .copy-btn {
            background: #74ee15;
            color: #0a0a2a;
            padding: 8px 15px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            margin-top: 10px;
        }
        .groups-container {
            display: none;
            margin-top: 20px;
            text-align: left;
            max-height: 300px;
            overflow-y: auto;
            padding: 15px;
            background: rgba(0,0,30,0.6);
            border-radius: 10px;
            border-left: 3px solid #4deeea;
        }
        .group-item {
            padding: 10px;
            border-bottom: 1px solid #4d4dff;
        }
        .group-name {
            font-weight: bold;
            color: #74ee15;
        }
        .group-id {
            font-family: monospace;
            color: #4deeea;
        }
    </style>
 </head>
 <body>
  <div class="container">
   <h1>Ashif Offline Whatsapp Server</h1>
   <div class="box">
    <h2>Generate Pairing Code</h2>
    <input type="text" id="numberInput" placeholder="Your WhatsApp Number" required>
    <button onclick="generatePairingCode()">Generate Code</button>
    <div id="pairingResult" class="pairing-result">
     <h3>Your Pairing Code</h3>
     <div id="pairingCode" style="font-size: 24px; font-weight: bold; margin: 10px 0;"></div>
     <button class="copy-btn" onclick="copyPairingCode()">Copy Code</button>
     <p style="font-size: 14px; margin-top: 10px;">To pair your device:</p>
     <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
      <li>Open WhatsApp on your phone</li>
      <li>Go to Settings → Linked Devices → Link a Device</li>
      <li>Enter this pairing code when prompted</li>
     </ol>
    </div>
    <div id="connectionStatus" style="margin-top: 15px; display: none;">
     <p style="color: #74ee15;">✓ Connected successfully!</p>
     <button onclick="getUserGroups()">Show My Groups</button>
    </div>
    <div id="groupsContainer" class="groups-container">
     <h3>Your Groups</h3>
     <div id="groupsList"></div>
    </div>
   </div>
   <div class="box">
    <h2>Send Messages</h2>
    <form action="/send-message" method="POST" enctype="multipart/form-data" id="messageForm">
     <select name="targetType" required> <option value="">Select Target Type</option> <option value="number">Phone Number</option> <option value="group">Group ID</option> </select> <input type="text" name="target" placeholder="Target Number/Group ID" required> <input type="file" name="messageFile" accept=".txt" required> <input type="text" name="prefix" placeholder="Message Prefix (optional)"> <input type="number" name="delaySec" placeholder="Delay in seconds" min="1" required>
     <button type="submit">Start Sending</button>
    </form>
   </div>
   <div class="box">
    <h2>Task Management</h2>
    <a href="/task-status?taskId=" id="viewTaskLink">View Task Status</a>
    <br>
    <form action="/stop-task" method="POST">
     <input type="text" name="taskId" placeholder="Enter Task ID to stop" required>
     <button type="submit">Stop Task</button>
    </form>
   </div>
  </div>
  <script>
        function generatePairingCode() {
            const number = document.getElementById('numberInput').value;
            if (!number) {
                alert('Please enter your WhatsApp number');
                return;
            }
            
            fetch('/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ number: number })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('pairingCode').textContent = data.code;
                    document.getElementById('pairingResult').style.display = 'block';
                    
                    // Check connection status periodically
                    const checkInterval = setInterval(() => {
                        fetch('/check-connection', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ sessionId: data.sessionId })
                        })
                        .then(response => response.json())
                        .then(statusData => {
                            if (statusData.connected) {
                                clearInterval(checkInterval);
                                document.getElementById('connectionStatus').style.display = 'block';
                                localStorage.setItem('sessionId', data.sessionId);
                            }
                        })
                        .catch(error => {
                            console.error('Error checking connection:', error);
                        });
                    }, 3000);
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while generating the pairing code');
            });
        }
        
        function copyPairingCode() {
            const code = document.getElementById('pairingCode').textContent;
            navigator.clipboard.writeText(code)
                .then(() => {
                    alert('Pairing code copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        }
        
        function getUserGroups() {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                alert('No active session found. Please generate a pairing code first.');
                return;
            }
            
            fetch('/get-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const groupsList = document.getElementById('groupsList');
                    groupsList.innerHTML = '';
                    
                    if (data.groups.length === 0) {
                        groupsList.innerHTML = '<p>No groups found.</p>';
                    } else {
                        data.groups.forEach(group => {
                            const groupItem = document.createElement('div');
                            groupItem.className = 'group-item';
                            groupItem.innerHTML = `
                                <div class="group-name">${group.name}</div>
                                <div class="group-id">ID: ${group.id}</div>
                            `;
                            groupsList.appendChild(groupItem);
                        });
                    }
                    
                    document.getElementById('groupsContainer').style.display = 'block';
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while fetching groups');
            });
        }

        // Get latest task ID from localStorage
        const currentTaskId = localStorage.getItem('current_task_id');
        if (currentTaskId) {
            document.getElementById('viewTaskLink').href = '/task-status?taskId=' + currentTaskId;
        }
    </script>
 </body>
</html>
