# submodule-checker
Check whether a submodule is on default branch (usually master), and report a github commit status.

## CONFIG (in your repos)

### Add config file

Config file `.submodule_checker.json`:
```json
[
  "/fqdns",
  "/hexo-theme-next",
  "/dayjs"
]
```



### Add github webhook

Add webhook in your project:

* Content Type: application/json
* Secret: none
* Which events would you like to trigger this webhook: Just the push event.

## EXAMPLE STATUS

![2017-11-02 21_46_04- wip get some users binding profiles by latesum pull request 627 pintia_i_li](https://user-images.githubusercontent.com/2534277/32329309-a85629bc-c017-11e7-9e51-aca32e4cd739.jpg)

![2017-11-02 21_49_53-fix judge listener by latesum pull request 637 pintia_inside-identity_li](https://user-images.githubusercontent.com/2534277/32329366-d4c40596-c017-11e7-964f-859579c24fa1.jpg)
