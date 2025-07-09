run-jekyll:
	bundle exec jekyll serve

sync-main:
	git checkout master .tool-versions
	git checkout master .pre-commit-config.yaml
	git checkout master .gitignore
	git checkout master .devcontainer
	git checkout master pyproject.toml
	git checkout master poetry.lock
	git checkout master poetry.lock
	git checkout master package.json
	git checkout master package-lock.json

# install targets
install: install-python install-hooks install-node install-jekyll

install-python:
	poetry install

install-node:
	npm ci

install-jekyll:
	gem install jekyll bundler
	bundle install

install-hooks: install-python
	poetry run pre-commit install --install-hooks --overwrite
