# Submodule Checker

Check whether a submodule is on default branch (usually master), and report a github commit status.

![image](https://user-images.githubusercontent.com/2534277/39818697-19a932bc-53d4-11e8-8f72-57786c2886e6.png)

## Config (in your repos)

### Add config file

Config file `.submodule_checker.json`:
```json
[
  "/fqdns",
  "/hexo-theme-next",
  "/dayjs"
]
```

Put each submodule path (relative to root of current project) to a json array.

This will check your submodule on default branch (master by default), if you would like to change default branch, please visit: https://help.github.com/articles/setting-the-default-branch/ .

### Install Github APP

Submodule Checker is now providing a Github App, you can install it here: https://github.com/apps/submodule-checker .

Please make sure your submodule project is also installed, otherwise commits cannot be compared.
