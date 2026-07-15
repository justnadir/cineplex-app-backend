import app from "./app";
import config from "./config";
import logger from "./shared/logger";

async function main() {
  try {
    app.listen(config.port, config.ip_address, () => {
      logger.info(
        `Server is running on port ${`http://${config.ip_address}:${config.port}`}`
      );
    });
  } catch (error) {
    logger.error(error);
  }
}

main();
