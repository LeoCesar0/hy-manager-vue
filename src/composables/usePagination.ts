import type { IPaginationBody } from "~/@types/pagination";
import { useRouteQuery } from '@vueuse/router'



type IProps = {
    queryKey?: string;
} & Omit<IPaginationBody, 'page'>


export const usePagination = ({ limit, orderBy, queryKey = 'page' }: IProps) => {

    const page = useRouteQuery(queryKey, 1, { transform: Number })

    const paginationBody = ref<IPaginationBody>({
        page: page.value,
        limit,
        orderBy,
    })

    watch(() => paginationBody.value.page, (newPage) => {
        page.value = newPage
    })

    return {
        paginationBody,
    }
};

