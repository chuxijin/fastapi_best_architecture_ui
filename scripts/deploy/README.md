# fba-frontend 部署指南

## 整体流程

```
GitHub (tag v* / 手动触发)
    ↓
GitHub Actions
    ├── pnpm install --frozen-lockfile
    ├── pnpm run build --filter=@vben/web-antdv-next
    └── rsync dist/ → 服务器:/www/wwwroot/WeBot/frontend/apps/web-antdv-next/dist/
```

- 直接 rsync 到服务器目标路径，`--delete` 清理旧文件（避免旧 hashed JS 累积）
- nginx 由宝塔面板管理，CI 不介入
- 构建产物同时作为 GitHub artifact 保留 7 天，方便本地下载调试

## 一、服务器准备（一次性）

### 1. 生成 SSH 密钥对

**本地机器执行：**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/fba_deploy_key -C "github-actions-fba-deploy" -N ""
```

- `fba_deploy_key` 是**私钥**，待会儿贴到 GitHub Secrets
- `fba_deploy_key.pub` 是**公钥**，贴到服务器

### 2. 把公钥加到服务器

SSH 到服务器后：

```bash
mkdir -p ~/.ssh
# 把 fba_deploy_key.pub 的内容追加进去
echo "ssh-ed25519 AAAA...公钥内容..." >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3. 确认目标目录存在（workflow 也会自动创建）

```bash
mkdir -p /www/wwwroot/WeBot/frontend/apps/web-antdv-next/dist
```

## 二、GitHub 仓库配置

`Settings → Secrets and variables → Actions → New repository secret`：

| Secret 名 | 示例值 | 说明 |
| --- | --- | --- |
| `DEPLOY_HOST` | `1.2.3.4` 或 `example.com` | 服务器地址 |
| `DEPLOY_USER` | `root` | SSH 登录用户 |
| `DEPLOY_SSH_PORT` | `22` | SSH 端口（非 22 必填） |
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | 上一步生成的**私钥完整内容** |

## 三、触发部署

### 手动触发

1. 仓库 → `Actions → Deploy web-antdv-next → Run workflow`
2. 选 branch，点 Run workflow

### Tag 触发（正式版）

```bash
git tag v1.0.0
git push origin v1.0.0
```

推送 `v*` 开头 tag 自动触发。

## 四、回滚

当前方案没有服务器版本化目录，回滚方式：

**方式 A：重跑旧 tag**

```bash
# 在仓库里找到之前稳定的 tag，再跑一次
git tag v1.0.0-rollback <之前好的 commit>
git push origin v1.0.0-rollback
```

**方式 B：本地下 artifact 手动传**

GitHub 仓库 `Actions → 找之前成功的 run → Artifacts → dist-xxx` 下载后手动覆盖服务器目录。

## 五、常见问题

**Q: 宝塔面板装了防火墙，Actions 连不上 22 端口？** 在宝塔安全里放行 GitHub Actions IP 段，或者用反向 SSH（部署 agent 模式）。

**Q: 服务器磁盘不够怎么办？** `--delete` 已经会清理旧产物，只保留当前一份 dist，磁盘压力很小。

**Q: 构建在 CI 失败、错误 JS heap out of memory？** workflow 已设 `NODE_OPTIONS=--max-old-space-size=4096`，如果还不够可提到 6144（GitHub runner 最大 7G）。
