import {
	type Accessor,
	type JSXElement,
	type Owner,
	createMemo,
	createSignal,
	getOwner,
	runWithOwner,
	untrack,
} from "solid-js";
import { match as plainMatch } from "ts-pattern";

type Guard = {
	type: "with" | "when";
	params: any[];
	handler: (v: any) => JSXElement;
};

type MatchResult = {
	guards: Guard[];
	terminator:
		| { type: "otherwise"; handler: (v: any) => JSXElement }
		| { type: "exhaustive" }
		| { type: "run" };
	owner: Owner | null;
	cache: Map<
		unknown,
		{
			input: {
				get: Accessor<unknown>;
				set: (v: unknown) => void;
			};
			el: JSXElement;
		}
	>;
};

export function Match<const Input>(props: {
	value: Input;
	children: (
		match: ReturnType<typeof plainMatch<Accessor<Input>, JSXElement>>,
	) => JSXElement;
}): JSXElement {
	const result = createMemo((): MatchResult => {
		const guards: Guard[] = [];
		const instance = {
			with(...args: any[]) {
				const params = args.slice(0, -1);
				const handler = args.at(-1);
				guards.push({ type: "with", params, handler });
				return instance;
			},
			when(...args: any[]) {
				const params = args.slice(0, -1);
				const handler = args.at(-1);
				guards.push({ type: "when", params, handler });
				return instance;
			},
			otherwise(handler: (v: any) => JSXElement): MatchResult {
				return {
					guards,
					terminator: { type: "otherwise", handler },
					owner: getOwner(),
					cache: new Map(),
				};
			},
			exhaustive(): MatchResult {
				return {
					guards,
					terminator: { type: "exhaustive" },
					owner: getOwner(),
					cache: new Map(),
				};
			},
			run(): MatchResult {
				return {
					guards,
					terminator: { type: "run" },
					owner: getOwner(),
					cache: new Map(),
				};
			},
		};
		return props.children(instance as any) as unknown as MatchResult;
	});

	return createMemo(() => {
		const { guards, terminator, owner, cache } = result();
		const value = props.value;

		let match: any = plainMatch(value);
		for (const guard of guards) {
			if (guard.type === "when") {
				match = match.when.apply(match, [...guard.params, () => guard.handler]);
			} else if (guard.type === "with") {
				match = match.with.apply(match, [...guard.params, () => guard.handler]);
			}
		}
		const handler =
			terminator.type === "otherwise"
				? match.otherwise(terminator.handler)
				: terminator.type === "exhaustive"
					? match.exhaustive()
					: match.run();

		const entry = cache.get(handler);
		if (entry !== undefined) {
			if (untrack(entry.input.get) !== value) {
				entry.input.set(value);
			}
			return entry.el;
		}
		return runWithOwner(owner, () => {
			const [get, set] = createSignal(value);
			const el = handler(get);
			cache.set(handler, { el, input: { get, set } });
			return el;
		});
	}) as unknown as JSXElement;
}
