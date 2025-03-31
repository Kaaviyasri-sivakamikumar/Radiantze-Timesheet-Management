"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { service } from "@/services/service";
import { useAuth } from "@/hooks/useAuth";

type EntityType = "client" | "vendor" | "visa";

type Entity = { id: string; name: string };

type EntityContextType = {
  entities: Record<EntityType, Entity[]>;
  getEntityNameById: (type: EntityType, id: string) => string;
  refreshEntities: (type?: EntityType) => void;
};

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export const EntityProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [entities, setEntities] = useState<Record<EntityType, Entity[]>>({
    client: [],
    vendor: [],
    visa: [],
  });

  const fetchEntities = useCallback(async (type: EntityType) => {
    if (isAuthenticated) {
      try {
        const response = await service.getEntities(type);
        if (response.data.success) {
          setEntities((prev) => ({ ...prev, [type]: response.data.entities }));
        }
      } catch (err) {
        console.error(`Failed to fetch ${type} entities`, err);
      }
    }
  }, [isAuthenticated]);

  const refreshEntities = (type?: EntityType) => {
    if (type) {
      fetchEntities(type);
    } else {
      ["client", "vendor", "visa"].forEach((t) =>
        fetchEntities(t as EntityType)
      );
    }
  };

  useEffect(() => {
    refreshEntities();
  }, [fetchEntities]);

  const getEntityNameById = (type: EntityType, id: string) => {
    return entities[type]?.find((e) => e.id === id)?.name || "";
  };

  return (
    <EntityContext.Provider
      value={{ entities, getEntityNameById, refreshEntities }}
    >
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = (): EntityContextType => {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error("useEntity must be used within an EntityProvider");
  }
  return context;
};
