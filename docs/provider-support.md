# Provider support

Updated: 2026-11-09. These are not production integrations. X account ownership has a selected and locally wired Primus template. The provider registry still marks all providers template_pending because no production service is enabled.

| Provider | Candidate claims | Current availability | Limit |
| --- | --- | --- | --- |
| Google Account | Account identity; email address | template_pending | This does not include Gmail inbox access. |
| Discord | Account identity; account status | template_pending | Server membership needs its own verified template. |
| X | Account ownership; follower information; tweet information | Local account ownership flow only | Template `2e3160ae-8b1e-45e3-8c59-426366278b9d` discloses `screen_name` from X settings. Other X claims remain pending. |
| GitHub | Profile identity; public profile attributes | template_pending | No private repository access is claimed. |
| TikTok | Account identity; supported account attributes | template_pending | Exact fields remain unknown. |

A candidate becomes ready only after its template, disclosed fields, conditions, source, SDK compatibility, and trusted verification path are checked. Use degraded when a previously ready integration is impaired. Use disabled to stop a configured integration. Do not show a ready badge based on a mock fixture.
