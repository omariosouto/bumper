# 1.6.2 - 2025-4-23

Updating access info to get details of repos


# 1.6.1 - 2025-4-21

The idea here is basically:
- Ensure that I will be able to merge the PR with a custom message `like this`


# 1.6.0 - 2025-4-13

This pull request includes changes to optimize the sequence of version control operations in the `index.js` file. The most important changes involve rearranging the order of git commands to ensure a single commit is made instead of multiple commits and adding retry logic for merging pull requests.
Changes to version control operations:
* [`index.js`](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L68-R74): Removed redundant git commands and adjusted the order to ensure `createGitCommit` and `pushToPR` are called only once. This helps in making a single commit instead of multiple commits.
Enhancements to merge process:
* [`index.js`](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346R161-R193): Added retry logic for merging pull requests with a maximum of 5 attempts and exponential backoff. This ensures more robust handling of transient errors during the merge process.
Version updates:
* [`package.json`](diffhunk://#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519L3-R3): Updated the version from `1.3.2` to `1.5.0`.
Documentation updates:
* [`CHANGELOG.md`](diffhunk://#diff-06572a96a58dc510037d5efa622f9bec8519bc1beab13c9f251e97e657a9d4edR1-R14): Added entries for versions `1.4.0` and `1.5.0` to document the changes made in this pull request.


# 1.5.0 - 2025-4-13

This pull request includes changes to the `index.js` file to optimize the sequence of version control operations. The most important changes involve rearranging the order of git commands to ensure a single commit is made instead of multiple commits.
Changes to version control operations:
* [`index.js`](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L68-R74): Removed redundant git commands and adjusted the order to ensure `createGitCommit` and `pushToPR` are called only once. This helps in making a single commit instead of multiple commits.


# 1.4.0 - 2025-4-13

This pull request includes changes to the `index.js` file to optimize the sequence of version control operations. The most important changes involve rearranging the order of git commands to ensure a single commit is made instead of multiple commits.
Changes to version control operations:
* [`index.js`](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L68-R74): Removed redundant git commands and adjusted the order to ensure `createGitCommit` and `pushToPR` are called only once. This helps in making a single commit instead of multiple commits.


# 1.3.2 - 2025-4-13

This pull request includes several changes to the `index.js` file to improve the handling of the `package.json` exports and streamline the commit process during the CI workflow. The most important changes include adding a function to reset the `package.json` exports, adjusting the order of operations to make a single commit, and ensuring the `package.json` exports are synced post-build.
### Improvements to handling `package.json` exports:
* Added `PACKAGE_JSON_ORIGINAL_EXPORTS` to store the original exports from `package.json`.
* Implemented the `resetPkgExports` function to reset the `package.json` exports to their original state.
* Modified the `syncPackageJSON` function to update the `package.json` exports with the post-build exports.
### Streamlining commit process:
* Adjusted the order of operations to include `resetPkgExports`, `createGitCommit`, and `pushToPR` to ensure a single commit is made instead of multiple commits.


# 1.3.1 - 2025-4-13

This pull request includes several changes to the `index.js` file to improve the handling of the `package.json` exports and streamline the commit process during the CI workflow. The most important changes include adding a function to reset the `package.json` exports, adjusting the order of operations to make a single commit, and ensuring the `package.json` exports are synced post-build.
### Improvements to handling `package.json` exports:
* Added `PACKAGE_JSON_ORIGINAL_EXPORTS` to store the original exports from `package.json`.
* Implemented the `resetPkgExports` function to reset the `package.json` exports to their original state.
* Modified the `syncPackageJSON` function to update the `package.json` exports with the post-build exports.
### Streamlining commit process:
* Adjusted the order of operations to include `resetPkgExports`, `createGitCommit`, and `pushToPR` to ensure a single commit is made instead of multiple commits.


# 1.3.0 - 2025-4-13

...


# 1.2.8 - 2025-4-13

This pull request includes changes to the `index.js` file to dynamically fetch the repository name for release comments. This ensures that the release links are always accurate, regardless of the repository they are in.
Key changes include:
* Updated the release comment to dynamically fetch the repository name using the new `getRepoName` method. This change is applied to both the regular release and beta release comments. [[1]](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L77-R77) [[2]](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L106-R106)
* Added a new method `getRepoName` to retrieve the repository name dynamically.


# 1.1.8 - 2025-4-13

This pull request includes changes to the `index.js` file to dynamically fetch the repository name for release comments. This ensures that the release links are always accurate, regardless of the repository they are in.
Key changes include:
* Updated the release comment to dynamically fetch the repository name using the new `getRepoName` method. This change is applied to both the regular release and beta release comments. [[1]](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L77-R77) [[2]](diffhunk://#diff-e727e4bdf3657fd1d798edcd6b099d6e092f8573cba266154583a746bba0f346L106-R106)
* Added a new method `getRepoName` to retrieve the repository name dynamically.


# 1.0.8 - 2025-4-13

Making all tests


# 1.0.7 - 2025-4-13

Making all tests


# 1.0.6 - 2025-4-13

Making all tests


# 1.0.5 - 2025-4-13

Making all tests


# 1.0.4 - 2025-4-13

Making all tests


# 1.0.3 - 2025-4-13

Making all tests


# 1.0.2 - 2025-4-13

Just adding everything needed to run this library through NPX


# 1.0.1 - 2025-4-13

In this PR, I'm enabling the support to call `npx @omariosouto/bumper` to be used in CI always with the latest version available of the bumper bot


