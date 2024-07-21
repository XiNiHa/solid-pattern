# solid-pattern

[ts-pattern](https://github.com/gvergnaud/ts-pattern) wrapper for Solid.

## Usage

```tsx
import { Match } from "solid-pattern";

type Union =
	| { type: "number"; number: number }
	| { type: "string"; string: string }
	| { type: "boolean"; boolean: boolean };

export default function Comp(props: { value: Union }) {
	return (
		<Match value={props.value}>
			{(match) =>
				match
					.when({ type: "number" }, (value) => <div>Number: {value().number}</div>)
					.when({ type: "string" }, (value) => <div>String: {value().string}</div>)
					.when({ type: "boolean" }, (value) => <div>Boolean: {value().boolean}</div>)
					.exhaustive()
			}
		</Match>
	);
}
```

This wrapper ensures that the JSX elements created with the `Match` component are memoized, so that the actual DOM elements are only created once.
