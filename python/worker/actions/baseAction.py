from worker.logging import utils as loggingUtils


class ActionError(Exception):
    def __init__(self):
        message = "Error processing Action"
        super().__init__(message)


class ValidationError(Exception):
    def __init__(self):
        message = "Error validating Action parameters"
        super().__init__(message)


class BaseAction:
    def __init__(self):
        self.LOGGING_AREA = "BaseAction"

    def validate_json(self, json):
        return {}

    def process(self, json):
        pass

    def validate_catalog_entry_id(self, json):
        try:
            catalog_entry_id = json["catalog_entry_catalog_id"]
            return catalog_entry_id
        except:
            self.raise_validation_error("invalid catalog_entry_id")

    def raise_action_error(self, message):
        self.log_action_error(message)
        raise ActionError()

    def raise_validation_error(self, message):
        self.log_action_error(message)
        raise ValidationError()

    def log_action_error(self, message):
        loggingUtils.error_log(self.LOGGING_AREA, message)

    def log_action(self, message):
        loggingUtils.standard_log(self.LOGGING_AREA, message)
