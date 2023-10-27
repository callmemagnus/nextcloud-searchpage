type TimeStampedData<T> = {
	timestamp: number;
	data: T;
};

export default class TimedCache<T> {
	readonly validityInMs: number;
	readonly cache = new Map<string, TimeStampedData<T>>();

	constructor(validityInMs: number) {
		this.validityInMs = validityInMs;
	}

	has(key: string): boolean {
		if (!this.cache.has(key)) {
			return false;
		}
		const now = Date.now();
		const cachedValue = this.cache.get(key)!;
		const isValid = cachedValue.timestamp + this.validityInMs > now;

		if (!isValid) {
			this.cache.delete(key);
		}
		return isValid;
	}

	clear(): void {
		this.cache.clear();
	}

	get(key: string): T | undefined {
		if (!this.has(key)) {
			return undefined;
		} else {
			return this.cache.get(key)!.data;
		}
	}

	set(key: string, value: T): this {
		const now = Date.now();
		this.cache.set(key, { timestamp: now, data: value });
		return this;
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	get size(): number {
		return this.cache.size;
	}

	keys(): IterableIterator<string> {
		return this.cache.keys();
	}
}
