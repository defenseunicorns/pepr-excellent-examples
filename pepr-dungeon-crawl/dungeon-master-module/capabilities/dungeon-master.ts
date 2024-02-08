import { Capability, Log, a } from "pepr";
import { notifyDeletion } from "./notificationClient";
//import { exec } from "child_process";

export const DungeonMaster = new Capability({
  name: "dungeon-master",
  description:
    "Capability creating dungeon master powers for the Pepr variant of BrogueCE.",
  namespaces: ["monsties", "pepr-dungeon-crawl"],
});
//
// Use the 'When' function to create a new action, use 'Store' to persist data
const { When } = DungeonMaster;

// This action watches for the "monsties" namespace to be created, then adds a label to the namespace.
When(a.Namespace)
  .IsCreated()
  .Mutate(ns => ns.SetLabel("game", "pepr-dungeon-crawl"));

// Prevent specific creature types from being deployed
When(a.Deployment)
  .IsCreated()
  .InNamespace("monsties")
  .Validate(req => {
    let monsterType;
    let msg;

    const monstie = req.Raw.metadata.name;
    try {
      monsterType = req.Raw.metadata.labels.monsterType;
    } catch (error) {
      monsterType = req.Raw.metadata?.labels?.["monsterType"];
      Log.error(
        error,
        "Failed to get monsterType labels off deployment in namespace monsties.",
      );
    }

    if (monsterType == "pink-jelly") {
      // TODO: Trigger the deletion of the monstie in the game
      msg = `Dungeon Master is denying deployment and deleting ${monstie} from the game.`;
      notifyDeletion(monstie)
        .then(() => {
          Log.info("No pink-jelly allowed notification sent successfully.");
        })
        .catch(error => {
          Log.error(`No pink-jelly allowed notification failed: ${error}`);
        });

      return req.Deny(monsterType);
    }

    if (monsterType == "bloat") {
      // TODO: Trigger the deletion of the monstie in the game
      msg = `Dungeon Master is denying deployment and deleting ${monstie} from the game.`;
      notifyDeletion(monstie)
        .then(() => {
          Log.info("No bloats allowed notification sent successfully.");
        })
        .catch(error => {
          Log.error(`No bloats allowed notification failed: ${error}`);
        });

      return req.Deny(monsterType);
    }

    if (monsterType == "pit-bloat") {
      // TODO: Trigger the deletion of the monstie in the game
      msg = `Dungeon Master is denying deployment and deleting ${monstie} from the game.`;
      notifyDeletion(monstie)
        .then(() => {
          Log.info("No pit-bloats allowed notification sent successfully.");
        })
        .catch(error => {
          Log.error(`No pit-bloats allowed notification failed: ${error}`);
        });

      return req.Deny(monsterType);
    }

    if (monsterType == "rat") {
      // TODO: Trigger the deletion of the monstie in the game
      msg = `Dungeon Master is denying deployment and deleting ${monstie} from the game.`;
      notifyDeletion(monstie)
        .then(() => {
          Log.info("No rats allowed notification sent successfully.");
        })
        .catch(error => {
          Log.error(`No rats allowed notification failed: ${error}`);
        });

      return req.Deny(msg);
    }
    return req.Approve();
  });

// Handle the deletion of monsties
// If a monstie is killed in the game, the game deletes the in-game monstie and
// sets the monstie's deployment deleteType label to "killed". The game then calls
// the the delete deployment action in deploymentAction.js on the monstie's deployment
// which deletes the deployment.
// The default deleteType is "dungeon-master". This label is used to indicate that
// the deployment was deleted by the dungeon master and that the in-game monstie
// needs to be deleted. Since it wasn't killed by the player in the game, the monstie
// will still exist in the game. The validation will need to trigger the deletion of the
// monstie in the game.
When(a.Deployment)
  .IsDeleted()
  .InNamespace("monsties")
  .Validate(req => {
    let deleteType;
    let msg;
    const monstie = req.Raw.metadata.name;

    try {
      deleteType = req.Raw.metadata.labels.deleteType;
    } catch (error) {
      deleteType = req.Raw.metadata?.labels?.["deleteType"];
      msg = `Failed to get deleteType label: ${deleteType}`;
      Log.error(error, msg);
    }
    if (deleteType == "killed") {
      Log.info(`Player killed ${monstie} in the game.`);
      notifyDeletion(monstie)
        .then(() => {
          Log.info(`Player killed ${monstie} notification sent successfully.`);
        })
        .catch(error => {
          Log.error(`Player killed ${monstie} notification failed: ${error}`);
        });

      return req.Approve();
    }

    if (deleteType == "dungeon-master") {
      // Admins can delete monstie deployments in the cluster
      // This will then trigger the deletion of the monstie in the game
      // TODO: Trigger the deletion of the monstie in the game
      Log.info(`Dungeon Master is deleting ${monstie} from the game.`);
      notifyDeletion(monstie)
        .then(() => {
          Log.info(
            `Dungeon Master deleting ${monstie} notification sent successfully.`,
          );
        })
        .catch(error => {
          Log.error(
            `Dungeon Master deleting ${monstie} notification: ${error}`,
          );
        });

      return req.Approve();
    }

    Log.info(`Default processis deleting ${monstie} from the game.`);

    notifyDeletion(monstie)
      .then(() => {
        Log.info("Default delete notification sent successfully.");
      })
      .catch(error => {
        Log.error(`Failed to send default delete notification: ${error}`);
      });

    return req.Approve();
  });
