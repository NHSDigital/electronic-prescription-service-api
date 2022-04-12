import io
import json
import logging
import time
from unittest import TestCase
from unittest.mock import patch

from utilities import mdc
from utilities import integration_adaptors_logger as log, config


@patch("utilities.config.config", new={'LOG_LEVEL': 'INFO'})
class TestLogger(TestCase):

    def tearDown(self) -> None:
        logging.getLogger().handlers = []
        mdc.correlation_id.set(None)

    @patch('sys.stdout', new_callable=io.StringIO)
    def test_log_level_threshold(self, mock_stdout):
        mock_stdout.truncate(0)

        config.config['LOG_LEVEL'] = 'CRITICAL'
        log.configure_logging()
        log.IntegrationAdaptorsLogger('TES').info('Test message')
        config.config['LOG_LEVEL'] = 'INFO'

        output = mock_stdout.getvalue()
        self.assertEqual("", output)

    @patch('sys.stdout', new_callable=io.StringIO)
    def test_name_can_be_empty(self, mock_stdout):
        mock_stdout.truncate(0)

        log.configure_logging()

        log.IntegrationAdaptorsLogger('SYS').info('%s %s', 'yes', 'no')

        log_entry = LogEntry(mock_stdout.getvalue())
        self.assertEqual('SYS', log_entry.name)

    @patch('sys.stdout', new_callable=io.StringIO)
    def test_message_format_and_log_entry_parts(self, mock_stdout):
        mock_stdout.truncate(0)

        log.configure_logging('TEST')
        mdc.correlation_id.set('15')

        log.IntegrationAdaptorsLogger('SYS').info('%s %s', 'yes', 'no')

        log_entry = LogEntry(mock_stdout.getvalue())

        self.assertEqual('15', log_entry.correlation_id)
        self.assertEqual('TEST.SYS', log_entry.name)
        self.assertEqual('INFO', log_entry.level)
        self.assertEqual('yes no', log_entry.message)
        time.strptime(log_entry.time, '%Y-%m-%dT%H:%M:%S.%f')

    @patch('utilities.config.get_config')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_should_log_critical_message_if_log_level_is_below_info(self, mock_stdout, mock_config):
        unsafe_log_levels = ['NOTSET', 'DEBUG']
        for level in unsafe_log_levels:
            def config_values(*args, **kwargs):
                return {
                    "LOG_LEVEL": level,
                    "LOG_FORMAT": ""
                }[args[0]]

            mock_stdout.truncate(0)
            with self.subTest(f'Log level {level} should result in critical log message being logged out'):
                mock_config.side_effect = config_values
                log.configure_logging()
                output = mock_stdout.getvalue()
                log_entry = LogEntry(output)
                self.assertEqual('CRITICAL', log_entry.level)
                self.assertEqual(f'The current log level ({level}) is set below INFO level,'
                                 f' it is known that libraries used '
                                 'by this application sometimes log out clinical patient data at DEBUG level. '
                                 'The log level provided MUST NOT be used in a production environment.',
                                 log_entry.message)

    @patch('utilities.config.get_config')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_should_not_log_critical_message_if_log_level_is_above_debug(self, mock_stdout, mock_config):
        safe_log_levels = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
        for level in safe_log_levels:
            def config_values(*args, **kwargs):
                return {
                    "LOG_LEVEL": level,
                    "LOG_FORMAT": ""
                }[args[0]]

            with self.subTest(f'Log level {level} should not result in critical log message being logged out'):
                mock_config.side_effect = config_values
                log.configure_logging()
                output = mock_stdout.getvalue()
                self.assertEqual('', output)


class LogEntry:
    def __init__(self, log_line: str):
        super().__init__()
        try:
            log_line = log_line[log_line.find('{"ascti'):]
            self._unpack(log_line)
        except ValueError as e:
            raise ValueError("Failed parsing log line '%s'", log_line, e)

    def _unpack(self, log_line: str):
        value = json.loads(log_line)
        self.time = value['asctime']
        self.level = value['level']
        self.process_id = value['process']
        self.correlation_id = value['correlation_id']
        self.name = value['name']
        self.message = value['message']
