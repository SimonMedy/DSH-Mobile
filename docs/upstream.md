# Upstream DeepSeek Harness

DSH Mobile is developed against the public upstream project and keeps it as a separate dependency boundary rather than vendoring or modifying it.

Official sources:

- https://deepseek.com/harness/en/
- https://github.com/deepseek-ai/deepseek-harness

DeepSeek Harness is currently a rapidly evolving project. Before changing assumptions about `dsh web`, networking, browser behavior, or plugins, verify them against the current upstream repository.

DSH Mobile intentionally does not include a source copy of DeepSeek Harness. A developer who needs a local upstream checkout for investigation can clone it next to this repository:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git ../deepseek-harness
```

That checkout is a reference only; DSH Mobile must continue to work against an unmodified user-operated Harness instance.
