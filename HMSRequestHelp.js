/**
 * Title: HMSRequestHelp
 * Author: Joe Shacar | joseph_shacar@hms.harvard.edu
 * Harvard Medical School
 * Date: 2023-04-17
 * Version: 1.1
 * 
 * Creates a button on a Cisco touch panel labled 'Request Help'. When a user clicks this button they will be asked to enter their email address.
 * Based on the time of clicking the button the program will either trigger the 'duringHoursPrompt' (weekdays between 8:00a and 5:00p) or the afterHoursPrompt.
 * duringHoursPrompt will create a Slack message AND create a STAT ticket. afterHoursPrompt will ONLY create a STAT ticket.
 * 
 **/
import xapi from 'xapi';

//Variables
let displayName;
let serialNumber;
let ipAddress;
let softwareVer;
let isAfterHours;
let userEmail;

// Slack Webhook URL
const slackURL = '*****'

const servicenow = {
  // ServiceNow instance, ex: https://harvardmed.service-now.com/ - enter only 'harvardmed'
  instance: '*****',
  // ServiceNow Key (Credentials, b64)
  key: '*****'               
};

function alert(title, text, duration) {
  xapi.Command.UserInterface.Message.Alert.Display({ Title: title, Text: text, Duration: duration });
  console.log(`${title}: ${text}`)
}

//8
//sendSTATTicket
function sendSTATTicket() {
  const incident = {
    caller_id: userEmail,
    u_service_offering: "In-Room AV Technology",
    category: "Troubleshoot",
    contact_type: "User self-service",
    assignment_group: "SN All Media",
    impact: "2",
    urgency: "2",
    short_description: 'Issue in ' + displayName + ' reported by ' + userEmail,
    description: `Customer - ${userEmail}\nRoom Name - ${displayName}\nIP Address - ${ipAddress}\nSoftware - ${softwareVer}\nDevice Serial - ${serialNumber}`
  };

  const url = `https://${servicenow.instance}.service-now.com/api/now/table/incident`;
  const body = JSON.stringify(incident);
  const header = ['Content-Type: application/json', 'Authorization: ' + 'Basic ' + servicenow.key];

  xapi.Command.HttpClient.Post({ Url: url, header, AllowInsecureHTTPS: 'True', ResultBody: 'PlainText' }, body)
  .then(r => {
    if(r.StatusCode > 200 && r.StatusCode < 300){
      const incidentNo = JSON.parse(r.Body).result.number;
      if(isAfterHours){
        alert('Success', 'ServiceNow ticket created: ' + incidentNo);
      }
      else{
        alert('Success', 'A technician has been requested. ServiceNow ticket created: ' + incidentNo);
      }
    } else {
      alert('Error', 'Status code: ' + r.StatusCode);
    }
  })
  .catch(() => alert('Error', 'Unable to create ticket', 10));
}

//(7)
//sendSlack
function sendSlack() {
  const header = ['Content-Type: Application/json',];
  var messagecontent = displayName + " - " + 'The customer ' + userEmail + ' has reported an issue in this room.';
  xapi.command(
    'HttpClient Post',
    { 'Header':header, 'Url':slackURL},
    JSON.stringify(Object.assign({'text': messagecontent}))).catch((error) => { console.error(error); });
}

//(6b)
//after hours prompt
function afterHoursPrompt() {
  xapi.command("UserInterface Message Prompt Display", {
    FeedbackId: 'requestHelp-after',
    Title: "Request Help - After Hours",
    Text: 'It is currently outside of operational hours. You can still submit a ticket and a technician will review during the next business day and follow up with you.',
    'Option.1':'Submit Ticket',
    'Option.2':'Cancel'
    }).catch((error) => { console.error(error); });
}

//event listener for afterHoursPrompt
xapi.Event.UserInterface.Message.Prompt.Response.on((event) => {
  if (event.FeedbackId === 'requestHelp-after') {
    switch(event.OptionId){
      //if user selects 'Submit'
      case '1':
        sendSTATTicket();
        break;
      //if user selects 'Cancel'
      case '2':
        console.log('Operation canceled by user')
        break;
    }
  }
});

//(6a)
//during hours prompt
function duringHoursPrompt() {
  xapi.command("UserInterface Message Prompt Display", {
    FeedbackId: 'requestHelp-during',
    Title: "Request Help - Confirm",
    Text: 'This will notify Media Services of an urgent issue in the room. Are you sure you want to report an issue and request a technician?',
    'Option.1':'Report the issue',
    'Option.2':'Cancel'
    }).catch((error) => { console.error(error); });
}

//event listener for duringHoursPrompt
xapi.Event.UserInterface.Message.Prompt.Response.on((event) => {
  if (event.FeedbackId === 'requestHelp-during') {
    switch(event.OptionId){
      //if user selects 'Report'
      case '1':
        sendSlack();
        sendSTATTicket();
        break;
      //if user selects 'Cancel'
      case '2':
        console.log('Operation canceled by user')
        break;
    }
  }
});

//(5)
//promptEmail - ask for user to input their email
async function promptEmail() {
  //show prompt for email, text input
  xapi.Command.UserInterface.Message.TextInput.Display({
    FeedbackId: 'user-email',
    Title: 'Request Help - Enter Email',
    Text: 'Please enter your email:',
  });
}

//event listener for promptEmail
//on event, save email text and call next function
xapi.Event.UserInterface.Message.TextInput.Response.on((event) => {
  if (event.FeedbackId === 'user-email') {
    //simple email validation - length of string should be > 5 and contains '@'
    if (event.Text.length > 5 && event.Text.includes(('@'))){
      userEmail = event.Text;
      console.log(`Email Address entered: ${userEmail}`);
      //once email is entered, go to duringHours or afterHours prompt
      if (isAfterHours ? afterHoursPrompt() : duringHoursPrompt());
    }
    //if email validation fails - show an error and rerun promptEmail
    else {
      xapi.command("UserInterface Message Prompt Display", {
        FeedbackId: 'email-validate',
        Title: "Email Error",
        Text: 'Email is invalid, please try again.',
        'Option.1':'OK',
      }).catch((error) => { console.error(error); });

      //listen for user to dismiss email error
      xapi.Event.UserInterface.Message.Prompt.Response.on((event) => {
        if (event.FeedbackId === 'email-validate') {
          switch(event.OptionId){
            case '1':
              promptEmail();
              break;
          }
        }
      });
    }
  }
});  

//(4)
//checkAfterHours - check to see if current time is between 8:00AM and 5:00PM on a weekday
function checkAfterHours() {
  // Get the current date and time
  let now = new Date();
  // Convert the current time into seconds
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  // Get the current day of the week
  const dayOfWeek = now.getDay();
  // Set values for weekend days
  const Sunday = 0, Saturday = 6;
  
  // If today is a weekday, then check if time is greater than 08:00AM and less than 05:00PM
  if (dayOfWeek != Saturday && dayOfWeek != Sunday){
    if (nowSeconds >= 28800 && nowSeconds <= 61200){
      return false;
    }
    else{
      return true;
    }
  }
  // If today is not a weekday
  else{
    return true;
  }
}

//(3)
//On button click
function onPanelClicked(e) {
  if (e.PanelId === 'hmsrequesthelp') {
    console.log(`Button Clicked @ ${Date()}`);
    //on button press, check if isAfterHours, store boolean
    isAfterHours = checkAfterHours();
    console.log(`After Hours = ${isAfterHours}`);
    promptEmail();
  }
}

//(2)
// Creates the button
function createPanel() {
  const panel = `
    <Extensions>
      <Version>1.7</Version>
        <Panel>
          <Order>1</Order>
            <PanelId>hmsrequesthelp</PanelId>
            <Origin>local</Origin>
			      <Type>Statusbar</Type>
            <Location>HomeScreenAndCallControls</Location>
            <Icon>Concierge</Icon>
            <Color>#D43B52</Color>
            <Name>Request Help</Name>
            <ActivityType>Custom</ActivityType>
        </Panel>
    </Extensions>
  `;
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'hmsrequesthelp' },
    panel
  )
}

//(1)
//Init function - grabs variables from system, defines listeners, and creates the button.
async function init() {
  await xapi.Config.HttpClient.Mode.set('On');
  await xapi.Config.HttpClient.AllowInsecureHTTPS.set('True');
  
  //set variables from system information
  displayName = await xapi.Status.UserInterface.ContactInfo.Name.get();
  ipAddress = await xapi.Status.Network.IPv4.Address.get();
  serialNumber = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get();
  softwareVer = await xapi.Status.SystemUnit.Software.DisplayName.get();
  
  //Create panel button
  createPanel();
  
  //listen for panel button press
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(onPanelClicked);
  
  console.log(`RequestHelp has been loaded on ${displayName} @ ${Date()}`);
  console.log(`Info: (${ipAddress} | ${serialNumber} | ${softwareVer})`);
}

init();