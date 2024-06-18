## Summary

**Remove items from this list if they are not relevant. Remove this line once this has been done**

- Routine Change
- :exclamation: Breaking Change
- :robot: Operational or Infrastructure Change
- :sparkles: New Feature
- :warning: Potential issues that might be caused by this change

### Details

Add any summary information of what is in the change. **Remove this line if you have nothing to add.**

## Pull Request Naming

Pull requests should be named using the following format:

```text
Tag: [AEA-NNNN] - Short description
```

Tag can be one of:

- `Fix` - for a bug fix. (Patch release)
- `Update` - either for a backwards-compatible enhancement or for a rule change that adds reported problems. (Patch release)
- `New` - implemented a new feature. (Minor release)
- `Breaking` - for a backwards-incompatible enhancement or feature. (Major release)
- `Docs` - changes to documentation only. (Patch release)
- `Build` - changes to build process only. (No release)
- `Upgrade` - for a dependency upgrade. (Patch release)
- `Chore` - for refactoring, adding tests, etc. (anything that isn't user-facing). (Patch release)

If the current release is x.y.z then
- a patch release increases z by 1
- a minor release increases y by 1
- a major release increases x by 1

Correct tagging is necessary for our automated versioning and release process ([Release](./RELEASE.md)).

The description of your pull request will be used as the commit message for the merge, and also be included in the changelog. Please ensure that your title is sufficiently descriptive.

### Rerunning Checks

If you need to rename your pull request, you can restart the checks by either:

- Closing and reopening the pull request
- pushing an empty commit 
  ```bash
  git commit --allow-empty -m 'trigger build'
  git push
  ```
- Amend your last commit and force push to the branch
  ```bash
  git commit --amend --no-edit
  git push --force
  ```

Rerunning the checks from within the pull request will not use the updated title.
