from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger(service="create_prescription")


@logger.inject_lambda_context(log_event=True, clear_state=True)
def handler(event: dict, context: LambdaContext) -> dict:
    logger.info("create_prescription handler invoked", event=event, context=context)

    return {"status": "success"}
