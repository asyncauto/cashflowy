// // // urlB64ToUint8Array is a magic function that will encode the base64 public key
// // // to Array buffer which is needed by the subscription option
// // const urlB64ToUint8Array = base64String => {
// //   const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
// //   const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
// //   const rawData = atob(base64)
// //   const outputArray = new Uint8Array(rawData.length)
// //   for (let i = 0; i < rawData.length; ++i) {
// //     outputArray[i] = rawData.charCodeAt(i)
// //   }
// //   return outputArray
// // }
// // self.addEventListener('activate', async () => {
// //   // This will be called only once when the service worker is activated.
// //   try {
// //   	console.log('trying to active the service worker');
// //     const applicationServerKey = urlB64ToUint8Array(
// //       'BJC2XFQ_vMRliHUgoai8Qyc1lGOFnubIEMEbWCQG4HVHCYyCpk01PkR9hRPA2OVde_zVn7adka9__r3MqaiQs6Q'
// //     )
// //     console.log('==== 2');
// //     const options = { applicationServerKey, userVisibleOnly: true }
// //     console.log('==== 3');
// //     const subscription = await self.registration.pushManager.subscribe(options)
// //     console.log('==== 4');
// //     console.log(JSON.stringify(subscription))
// //     console.log('==== 5');
// //   } catch (err) {
// //     console.log('Error', err)
// //   }
// // })

// // urlB64ToUint8Array is a magic function that will encode the base64 public key
// // to Array buffer which is needed by the subscription option
// const urlB64ToUint8Array = base64String => {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding)
//     .replace(/\-/g, "+")
//     .replace(/_/g, "/");
//   const rawData = atob(base64);
//   const outputArray = new Uint8Array(rawData.length);
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// };

// const saveSubscription = async subscription => {
//   const SERVER_URL = "http://localhost:4000/save-subscription";
//   const response = await fetch(SERVER_URL, {
//     method: "post",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify(subscription)
//   });
//   return response.json();
// };

// self.addEventListener("install", async () => {
//   // This will be called only once when the service worker is installed for first time.
//   try {
//     // const applicationServerKey = urlB64ToUint8Array(
//     //   "BJC2XFQ_vMRliHUgoai8Qyc1lGOFnubIEMEbWCQG4HVHCYyCpk01PkR9hRPA2OVde_zVn7adka9__r3MqaiQs6Q"
//     // );
//     // const options = { applicationServerKey, userVisibleOnly: true };
//     // const subscription = await self.registration.pushManager.subscribe(options);
//     // console.log(JSON.stringify(subscription));
//     // const response = await saveSubscription(subscription);
//     // console.log(response);
//   } catch (err) {
//     console.log("Error", err);
//   }
// });

// self.addEventListener("push", function(event) {
//   if (event.data) {
//     console.log("Push event!! ", event.data.text());
//   } else {
//     console.log("Push event but no data");
//   }
// });


// self.addEventListener('notificationclose',function(event){
// 	var notification = event.notification;
// 	console.log(notification);
// 	self.registration.showNotification('You just closed a notification',{body:'this would be the body of the notification'});
// })

self.addEventListener('push',function(event){
	var title = event.data.text();
	console.log('sending out notification');
	console.log(event);
	event.waitUntil(self.registration.showNotification(title));

})