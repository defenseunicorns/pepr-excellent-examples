import axios from "axios";
import { Log } from "pepr";

// Notify the Brogue C server that a deployment has been deleted
export async function notifyDeletion(deploymentName: string): Promise<void> {
  Log.info(
    `********** Notification client is notifying Brogue server of deployment deletion: ${deploymentName} **********`,
  );
  const data = {
    deploymentName: deploymentName,
    action: "deleted",
  };

  // Updated to use the Kubernetes DNS name of the Traefik service
  const notificationServiceUrl =
    "http://dungeon-notification-service.pepr-dungeon-crawl.svc.cluster.local:8888/deployment-deletion";

  try {
    Log.info(`Sending notification to: ${notificationServiceUrl}`);
    const response = await axios.post(notificationServiceUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    Log.info(
      `XXXXX Response data from axios request: ${JSON.stringify(
        response.data,
      )} XXXXX`,
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // This means the error is an Axios error
      if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        Log.info(
          `YYYYY Error response from axios request: ${JSON.stringify(
            error.response.data,
          )} YYYYY`,
        );
        Log.info(`Status code: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        Log.info(
          `ZZZZZ The request was made but no response was received ZZZZZ`,
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        Log.info(`Error message: ${error.message}`);
      }
    } else {
      // The error is not an Axios error
      Log.info(`Unexpected error: ${error}`);
    }
  }
}

// Assuming you have a mechanism to call this function with the deploymentName
// For example, using process.argv as in the original script:
export async function cliNotificationClient(): Promise<void> {
  const deploymentName: string = process.argv[2]; // Get deployment name from command line argument

  if (deploymentName) {
    await notifyDeletion(deploymentName);
  } else {
    Log.info(`Usage: ts-node notificationClient.ts <deploymentName>`);
  }
}
