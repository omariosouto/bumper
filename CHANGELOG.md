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


