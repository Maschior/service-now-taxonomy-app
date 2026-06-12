export interface Application {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  _id: string;
  name: string;
  applicationId: string | Application;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  _id: string;
  name: string;
  moduleIds: (string | Module)[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  _id: string;
  name: string;
  incidentIds: (string | Incident)[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagCategory {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  categoryId: string | TagCategory;
  description?: string;
  createdAt: string;
}

export interface TaxonomyData {
  applications: Application[];
  modules: Module[];
  incidents: Incident[];
  actions: Action[];
  tags: Tag[];
  tagCategories: TagCategory[];
}
