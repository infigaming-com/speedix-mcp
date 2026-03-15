# Speedix MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)

Official [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server for the [Speedix](https://speedix.io) iGaming platform. Enables AI assistants like Claude, ChatGPT, and other MCP-compatible clients to manage online casino and sportsbook operations through natural language.

## What is Speedix?

[Speedix](https://speedix.io) is a turnkey iGaming platform that provides everything you need to launch and operate an online casino, sportsbook, or gaming site. Key features include:

- **Turnkey Solution** — Launch a fully branded online casino or sportsbook in minutes
- **1000+ Games** — Slots, live casino, table games, crash games from top providers
- **Crypto & Fiat** — Support for 50+ cryptocurrencies and traditional payment methods
- **White Label** — Fully customizable branding, domains, and player experience
- **Multi-tier Operator Model** — Company, retailer, and operator hierarchy for complex business structures
- **Built-in VIP & CRM** — Player retention tools, VIP levels, deposit rewards, and automated campaigns
- **Affiliate System** — Commission plans, tracking, postbacks, and referral programs
- **Real-time Analytics** — Revenue, GGR/NGR, player retention, and game performance reports

Learn more at [speedix.io](https://speedix.io)

## What is Speedix MCP?

This MCP server exposes **173 tools** that cover the full Speedix backoffice API, allowing AI assistants to:

- Create and configure operators (online casino sites)
- Manage games, providers, and categories
- Handle player accounts, KYC, and responsible gambling
- Configure payment methods and currencies
- Set up VIP programs, deposit rewards, and promo campaigns
- Run CRM campaigns with segmentation and workflows
- Manage affiliates, commission plans, and referral programs
- Generate financial reports and analytics
- Configure notifications and alert channels

## Quick Start

### Install via npm

```bash
npm install -g speedix-mcp
```

### Configure in your AI client

Add to your MCP client config (e.g. Claude Desktop, Claude Code):

```json
{
  "mcpServers": {
    "speedix-mcp": {
      "command": "speedix-mcp",
      "env": {
        "MEEPO_EMAIL": "your-email@example.com",
        "MEEPO_PASSWORD": "your-password",
        "MEEPO_ORIGIN": "https://your-backoffice.meepo.site"
      }
    }
  }
}
```

**New user?** No account needed to start — just use the `create_company` tool to register directly.

### Install from source

```bash
git clone https://github.com/infigaming-com/speedix-mcp.git
cd speedix-mcp
npm install
npm run build
```

Then point your MCP client to `node /path/to/speedix-mcp/dist/index.js`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MEEPO_API_BASE_URL` | No | `https://apiport.xyz` | API endpoint |
| `MEEPO_ORIGIN` | No | `https://bo.speedixadm.com` | Backoffice origin |
| `MEEPO_EMAIL` | No | — | Login email |
| `MEEPO_PASSWORD` | No | — | Login password |
| `MEEPO_TOTP_SECRET` | No | — | TOTP secret for auto 2FA |

All variables are optional. Without credentials, use the `login` or `create_company` tool to authenticate.

## Tools (173)

### Authentication (4)
| Tool | Description |
|------|-------------|
| `login` | Login with credentials, supports auto 2FA |
| `setup_2fa` | Generate 2FA secret and QR code |
| `bind_2fa` | Complete first-time 2FA binding |
| `complete_2fa_login` | Verify 2FA code to complete login |

### Operator Management (18)
| Tool | Description |
|------|-------------|
| `create_company` | Register a new company (no auth required) |
| `create_operator` | Create operator under current company |
| `list_operators` | List all accessible operators |
| `list_company_operators` | List company-tier operators |
| `list_bottom_operators` | List player-facing site operators |
| `list_operators_by_parent` | List operators under a parent |
| `get_operator_details` | Get operator config, domains, status |
| `update_operator_name` | Update operator display name |
| `update_operator_status` | Set operator status (pending/live) |
| `manage_operator_subdomain` | Manage frontend/backoffice subdomains |
| `get_registration_config` | Get player registration settings |
| `set_registration_config` | Update registration settings |
| `get_account_settings` | Get operator account settings |
| `update_account_settings` | Update account settings |
| `list_operator_templates` | List available site templates and color schemes |
| `upload_operator_config` | Upload site config.json and manifest.json |
| `get_exchange_rates` | Get currency exchange rates |
| `operator_swap` | Swap currencies for an operator |

### User Management (18)
| Tool | Description |
|------|-------------|
| `list_users` | List/search users |
| `get_user_overview` | Get user summary (balance, activity) |
| `get_user_profile` | Get detailed user profile |
| `update_user` | Update user fields |
| `add_user_comment` | Add admin comment on user |
| `list_user_comments` | List comments on a user |
| `get_user_tags` / `set_user_tags` | Manage user tags |
| `get_operator_tags` / `set_operator_tags` | Manage operator-level tags |
| `get_operator_tags_config` / `set_operator_tags_config` | Configure tag definitions |
| `list_user_session_activities` | View user login sessions |
| `list_user_identities` | List user KYC identities |
| `audit_user_identity` | Approve/reject identity verification |
| `pre_launch_check` | Pre-launch readiness check |
| `get_user_responsible_gambling_config` | Get responsible gambling settings |
| `delete_user_responsible_gambling_config` | Remove gambling restrictions |

### Game Management (10)
| Tool | Description |
|------|-------------|
| `list_game_providers` | List game providers with status |
| `list_games` | List/search games |
| `list_game_categories` | List game categories |
| `update_game` | Update game settings |
| `update_game_provider` | Enable/disable providers |
| `list_provider_rates` | View provider rate configs |
| `list_game_tags` / `create_game_tag` | Manage game tags |
| `list_bets` | List bet history |
| `get_bet` | Get bet details |

### Wallet & Currency (16)
| Tool | Description |
|------|-------------|
| `list_wallet_currencies` | List supported currencies |
| `add_wallet_currency` | Add a currency |
| `update_wallet_currency` | Update currency settings |
| `get_operator_balances` | Get all currency balances |
| `get_operator_balance` | Get single currency balance |
| `operator_transfer` | Transfer between operators |
| `list_operator_transactions` | List wallet transactions |
| `get_deposit_reward_config` | Get deposit bonus config |
| `set_deposit_reward_sequences` | Set deposit reward sequences |
| `list_promo_campaigns` | List promo campaigns |
| `create_promo_campaign` | Create promo campaign |
| `generate_promo_codes` | Generate promo codes |
| `get_fica_config` / `set_fica_config` | FICA threshold config |
| `get_exchange_rates` | Get exchange rates |

### Finance (11)
| Tool | Description |
|------|-------------|
| `list_invoices` | List invoices |
| `get_invoice_detail` / `get_invoice_summary` | Invoice details |
| `list_revenue_shares` | Revenue share records |
| `list_revenue_share_rate_configs` | Revenue share rate configs |
| `list_third_party_fees` | Third-party fee records |
| `list_adjustments` / `add_adjustment` | Manual adjustments |
| `get_balance_summary` | Financial balance summary |
| `get_tax_report_config` / `list_tax_reports` | Tax reporting |

### Payment (4)
| Tool | Description |
|------|-------------|
| `list_payment_methods` | List configured payment methods |
| `list_supported_payment_methods` | List available payment methods |
| `create_payment_method` | Add a payment method |
| `list_payment_transactions` | List payment transactions |

### Reports (13)
| Tool | Description |
|------|-------------|
| `get_report_summary` / `list_report_summaries` | Revenue, GGR, NGR summaries |
| `get_game_data_summary` / `list_game_data` | Game performance data |
| `get_deposit_summaries` / `list_deposit_details` | Deposit reports |
| `get_withdrawal_summaries` / `list_withdrawal_details` | Withdrawal reports |
| `list_player_retention` | Player retention metrics |
| `get_player_game_data` | Per-player game stats |
| `get_customer_record` | Detailed customer record |
| `list_referral_report` | Referral reports |
| `list_affiliate_report` | Affiliate reports |

### VIP (7)
| Tool | Description |
|------|-------------|
| `get_vip_setting` | Get VIP config with level templates |
| `update_vip_setting` | Update VIP settings |
| `create_vip_level_template` | Create level template |
| `update_vip_level_template` | Update level template |
| `delete_vip_level_template` | Delete level template |
| `adjust_user_vip_level` | Manually adjust user VIP level |
| `get_user_vip_level_options` | Get available VIP levels for a user |

### Affiliate (29)
| Tool | Description |
|------|-------------|
| `create_affiliate` / `update_affiliate` / `delete_affiliate` | Manage affiliates |
| `list_affiliates` / `get_affiliate_details` | View affiliates |
| `create_commission_plan` / `update_commission_plan` / `delete_commission_plan` | Commission plans |
| `list_commission_plans` / `get_commission_plan` | View plans |
| `create_affiliate_campaign` / `update_affiliate_campaign` / `delete_affiliate_campaign` | Campaigns |
| `list_affiliate_campaigns` | View campaigns |
| `list_postbacks` / `create_postback` / `list_postback_logs` | Postback tracking |
| `list_affiliate_domains` / `set_affiliate_domain` | Domain management |
| `list_affiliate_events` / `list_commissions` | Event & commission data |
| `list_affiliate_users` / `list_affiliate_bills` | User & billing data |
| `get_affiliate_settings` / `update_affiliate_settings` | Affiliate settings |
| `get_referral_plan` / `set_referral_plan` | Referral program |
| `get_affiliate_dashboard` / `get_affiliate_trend` | Analytics |

### CRM (23)
| Tool | Description |
|------|-------------|
| `create_crm_campaign` / `update_crm_campaign` / `delete_crm_campaign` | Campaign CRUD |
| `get_crm_campaign` / `list_crm_campaigns` | View campaigns |
| `set_crm_campaign_workflow` / `get_crm_campaign_workflow` | Workflow config |
| `validate_crm_campaign_workflow` | Validate workflow |
| `get_crm_workflow_schema` | Get workflow JSON schema |
| `activate_crm_campaign` / `pause_crm_campaign` / `trigger_crm_campaign` | Campaign lifecycle |
| `list_crm_campaign_executions` / `get_crm_campaign_execution_steps` | Execution history |
| `create_segment` / `update_segment` / `delete_segment` | Segment CRUD |
| `get_segment` / `list_segments` | View segments |
| `calculate_segment` | Calculate segment size |
| `get_segment_users` / `get_user_segments` | Segment membership |
| `get_segment_field_schema` | Segment field definitions |

### Account & Roles (11)
| Tool | Description |
|------|-------------|
| `add_account` | Create admin account |
| `list_accounts` / `get_account_detail` | View accounts |
| `update_account` | Update account |
| `get_account_info` | Get current account info |
| `admin_reset_password` / `admin_reset_2fa` | Admin resets |
| `create_role` / `update_role` / `delete_role` | Role management |
| `list_roles` | List roles |

### Notifications (9)
| Tool | Description |
|------|-------------|
| `create_notification_channel` / `update_notification_channel` / `delete_notification_channel` | Channel CRUD |
| `list_notification_channels` / `get_notification_channel` | View channels |
| `test_notification_channel` | Send test notification |
| `save_notification_rules` / `list_notification_rules` | Notification rules |
| `get_notification_message_types` | Available message types |

## Prompts

| Prompt | Description |
|--------|-------------|
| `new_operator_setup` | Step-by-step guide for creating and configuring a new operator |
| `operator_health_check` | Comprehensive health check (status, balances, games, metrics) |
| `financial_review` | Financial review report for a time period |
| `operator_comparison` | Compare performance across operators |

## Security

- All API calls use HTTPS (enforced for non-localhost)
- Authentication via JWT with auto-refresh
- 2FA (TOTP) support with auto-completion
- Credentials are only stored in memory, never persisted

## License

MIT
