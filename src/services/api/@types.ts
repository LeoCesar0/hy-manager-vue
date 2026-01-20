import type { IHandleAppRequestProps } from "./@handlers/handle-app-request";

export type IAPIRequestCommon<T> = {
    options?: IHandleAppRequestProps<T>;
}