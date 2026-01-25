# Padrão de API

Este documento descreve o padrão estabelecido para todas as funções de API neste projeto.

## Estrutura Base

Todas as funções de API devem seguir este padrão:

### 1. Imports

```typescript
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate"; // ou outra função do Firebase
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";
```

### 2. Type Definition

```typescript
type Item = IModelType;

export type IAPIFunctionName = {
  data: ICreateModel; // ou outros parâmetros necessários
} & IAPIRequestCommon<Item>;
```

### 3. Implementação da Função

```typescript
export const functionName = async ({ data, options }: IAPIFunctionName) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "collectionName",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Nome do Item" }),
      ...options,
    }
  );
  return response;
};
```

## Tipos de Operações

### CREATE
- **Firebase Function**: `firebaseCreate`
- **Toast Helper**: `getDefaultCreateToastOptions`
- **Type Pattern**: `IAPICreate[Entity]`
- **Parameters**: `{ data: ICreate[Entity] }`

### UPDATE
- **Firebase Function**: `firebaseUpdate`
- **Toast Helper**: `getDefaultUpdateToastOptions`
- **Type Pattern**: `IAPIUpdate[Entity]`
- **Parameters**: `{ id: string, data: IUpdate[Entity] }`

### DELETE
- **Firebase Function**: `firebaseDelete`
- **Toast Helper**: `getDefaultDeleteToastOptions`
- **Type Pattern**: `IAPIDelete[Entity]`
- **Parameters**: `{ id: string }`

### GET/LIST
- **Firebase Function**: `firebaseList` ou `firebaseGet`
- **Toast Helper**: `getDefaultGetToastOptions`
- **Type Pattern**: `IAPIGet[Entities]`
- **Parameters**: Varia por caso de uso

### PAGINATE
- **Firebase Function**: `firebasePaginatedList`
- **Toast Helper**: `getDefaultGetToastOptions`
- **Type Pattern**: `IAPIPaginate[Entities]`
- **Parameters**: Inclui `pagination: IPaginationBody`

## Regras Importantes

1. ❌ **NUNCA** usar `useFirebaseStore()` diretamente
2. ✅ **SEMPRE** importar funções diretamente de `/services/firebase`
3. ✅ **SEMPRE** usar `handleAppRequest` para wrapping
4. ✅ **SEMPRE** adicionar toast options apropriadas
5. ✅ **SEMPRE** seguir o padrão de tipagem `IAPIRequestCommon`
6. ✅ **SEMPRE** usar labels em português para o usuário
7. ✅ **SEMPRE** usar nomenclatura em inglês no código

## Exemplos Completos

### Create Example

```typescript
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICategory, ICreateCategory } from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = ICategory;

export type IAPICreateCategory = {
  data: ICreateCategory;
} & IAPIRequestCommon<Item>;

export const createCategory = async ({ data, options }: IAPICreateCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "categories",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};
```

### Update Example

```typescript
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICategory, IUpdateCategory } from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type Item = ICategory;

export type IAPIUpdateCategory = {
  id: string;
  data: IUpdateCategory;
} & IAPIRequestCommon<Item>;

export const updateCategory = async ({ id, data, options }: IAPIUpdateCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate({
        collection: "categories",
        id,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};
```

### Delete Example

```typescript
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteCategory = {
  id: string;
} & IAPIRequestCommon<void>;

export const deleteCategory = async ({ id, options }: IAPIDeleteCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseDelete({
        collection: "categories",
        id,
      });
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};
```

## Toast Item Names (em Português)

- **Usuário** - User
- **Transação** - Transaction
- **Categoria** - Category
- **Terceiro** - Counterparty/Creditor
- **Conta Bancária** - Bank Account

## Benefícios deste Padrão

1. **Consistência**: Todas as APIs seguem a mesma estrutura
2. **Type Safety**: TypeScript garante tipos corretos
3. **Error Handling**: Centralizado no `handleAppRequest`
4. **Toast Notifications**: Feedback automático para o usuário
5. **Testabilidade**: Fácil de testar e mockar
6. **Manutenibilidade**: Fácil de entender e modificar
