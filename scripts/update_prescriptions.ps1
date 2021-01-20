#poetry install
cd ./scripts
poetry run python update_prescriptions.py https://internal-dev-sandbox.api.service.nhs.uk/electronic-prescriptions-pr-333
cd ..