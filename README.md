# HMSRequestHelp
Request Help button for Cisco video endpoint touch panels.

## About
HMSRequestHelp is a JavaScript/xAPI macro for Cisco video endpoints (SX Series, Room Series) that allows a room user to request technical assistance by sending a Slack message and generating a ServiceNow incident ticket.

## Features
-	Creates and Slack message and generates a ServiceNow incident ticket.
-	Two behaviors depending on whether it is during or after business hours.
	-	During hours, the button will send both a Slack message and create a ServiceNow ticket.
	-	After hours, the button will only create a STAT ticket.
-	Prompts the user for an Email address that is used in the Slack message and ServiceNow ticket.
-	On successful ticket creation, the user is provided with the ServiceNow INC incident number.

## Screenshots
<img width="500" alt="HMSRequestHelp_1" src="https://user-images.githubusercontent.com/123468477/232540711-dd2be135-0ae4-4ca9-b350-550c82551602.png"> <img width="500" alt="HMSRequestHelp_2" src="https://user-images.githubusercontent.com/123468477/232540716-f3d37303-f92a-4598-87f8-a00e9acacdb9.png">
<img width="500" alt="HMSRequestHelp_3" src="https://user-images.githubusercontent.com/123468477/232540717-c3e174dc-7130-4d72-b550-4cc8b086f71f.png"> <img width="500" alt="HMSRequestHelp_4" src="https://user-images.githubusercontent.com/123468477/232540719-53d0f5dd-0016-457e-8e3a-727f84375207.png">
<img width="500" alt="HMSRequestHelp_5" src="https://user-images.githubusercontent.com/123468477/232541054-8264ed33-5286-44e5-b1dd-6baddfbf80f0.png">

## Installation
1. Download the macro using the [Latest Release](https://github.com/jshacar-hms/HMSRequestHelp/releases/latest)
2. Site specific variables are left blank, please fill these in accordingly
3. Log into a Cisco Endpoint Web Interface
4. Open the Macro Editor (Customization > Macro Editor)
5. Select 'Import from file…' and upload the downloaded file
6. Click the 'Save to video system' icon next to the filename

## Requirements
-	Slack Administrator account, ability to create a Webhook
-	ServiceNow Administrator account, ability to create a user with API permissions.
