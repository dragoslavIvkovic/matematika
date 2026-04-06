import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

export async function scheduleDailyNotifications() {
  // Clear existing notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule for 8:00 AM (Morning Exercise)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Morning Brain Exercise! 🧠",
      body: "Ready to solve today's first equation? Just 3 minutes to stay sharp!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });

  // Schedule for 2:00 PM (Afternoon Boost)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Afternoon Boost! ⚡",
      body: "Keep your streak alive! A quick practice session is waiting for you.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 14,
      minute: 0,
      repeats: true,
    },
  });

  console.log("✅ Daily notifications successfully scheduled for 08:00 and 14:00");
}

export async function initNotifications() {
  await registerForPushNotificationsAsync();
  await scheduleDailyNotifications();
}
