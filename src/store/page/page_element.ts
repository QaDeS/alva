import * as MobX from 'mobx';
import { Pattern } from '../pattern';
import { Property } from '../pattern/property';
import { PropertyValue } from './property_value';
import { Store } from '..';

export class PageElement {
	@MobX.observable private children: PageElement[] = [];
	private parent: PageElement | undefined;
	private patternPath: string;
	private pattern?: Pattern;
	@MobX.observable private propertyValues: Map<string, PropertyValue> = new Map();

	// tslint:disable-next-line:no-any
	public constructor(store: Store, json: any, parent?: PageElement) {
		this.parent = parent;

		this.patternPath = json['pattern'];
		const pattern: Pattern | undefined = store.getPattern(this.patternPath);
		if (pattern) {
			this.pattern = pattern;
		} else {
			console.warn(`Ignoring unknown pattern "${this.patternPath}"`);
			return;
		}

		if (json.properties) {
			Object.keys(json.properties).forEach((propertyId: string) => {
				// tslint:disable-next-line:no-any
				const value: any = json.properties[propertyId];
				this.setPropertyValue(propertyId, this.createElementOrValue(value, store));
			});
		}

		if (json.children) {
			this.children = json.children.map(
				// tslint:disable-next-line:no-any
				(childJson: any) => this.createElementOrValue(childJson, store)
			);
		}
	}

	// tslint:disable-next-line:no-any
	protected createElementOrValue(json: any, store: Store): PageElement | PropertyValue {
		if (json && json['_type'] === 'pattern') {
			return new PageElement(store, json, this);
		} else {
			return json;
		}
	}

	public getChildren(): PageElement[] {
		return this.children;
	}

	public getParent(): PageElement | undefined {
		return this.parent;
	}

	public getPattern(): Pattern | undefined {
		return this.pattern;
	}

	public getPatternPath(): string {
		return this.patternPath;
	}

	public getPropertyValue(id: string): PropertyValue {
		const value: PropertyValue = this.propertyValues.get(id);

		return value;
	}

	public isRoot(): boolean {
		return this.parent === undefined;
	}

	// tslint:disable-next-line:no-any
	public setPropertyValue(id: string, value: any): void {
		if (!this.pattern) {
			throw new Error('This element has no valid pattern');
		}

		const property: Property | undefined = this.pattern.getProperty(id);
		if (!property) {
			console.warn(`Ignoring unknown property "${id}"`);
			return;
		}

		this.propertyValues.set(id, value);
	}
}
