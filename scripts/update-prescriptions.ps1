#poetry install
cd ./scripts
poetry run python update_prescriptions.py https://$env.api.service.nhs.uk/electronic-prescriptions$pr_prefix$pr
cd ..