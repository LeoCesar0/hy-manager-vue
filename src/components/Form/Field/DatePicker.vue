<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useVModel } from '@vueuse/core';
import type { HTMLAttributes } from 'vue';
import {
    DatePickerArrow,
    DatePickerCalendar,
    DatePickerCell,
    DatePickerCellTrigger,
    DatePickerContent,
    DatePickerField,
    DatePickerGrid,
    DatePickerGridBody,
    DatePickerGridHead,
    DatePickerGridRow,
    DatePickerHeadCell,
    DatePickerHeader,
    DatePickerHeading,
    DatePickerInput,
    DatePickerNext,
    DatePickerPrev,
    DatePickerRoot,
    DatePickerTrigger,
    type DatePickerRootProps,
    type DateValue,
} from 'reka-ui'
import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import { parseToDate } from '~/helpers/parseToDate';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export type IDatePickerProps = {
    modelValue?: Timestamp | Date | string | number;
    defaultValue?: Timestamp | Date | string | number;
    class?: HTMLAttributes['class'];
    placeholder?: string;
    disabled?: boolean;
    locale?: string;
    options?: DatePickerRootProps
}

const defaultOptions: DatePickerRootProps = {
    granularity: 'day'
}

const props = withDefaults(defineProps<IDatePickerProps>(), {
    placeholder: 'Pick a date',
    locale: undefined,
});

const _options = computed(() => {
    return {
        ...defaultOptions,
        ...props.options ?? {}
    }
})

const userLocale = computed(() => {
    if (props.locale) return props.locale;

    if (typeof navigator !== 'undefined') {
        return navigator.language || 'en-US';
    }

    return 'en-US';
});

const emits = defineEmits<{
    (e: 'update:modelValue', payload: Timestamp | Date | string | number | undefined): void;
}>();

const convertToCalendarDate = (value: Timestamp | Date | string | number | undefined): DateValue | undefined => {
    if (!value) return undefined;

    try {
        const jsDate = parseToDate(value);

        return new CalendarDateTime(
            jsDate.getFullYear(),
            jsDate.getMonth() + 1,
            jsDate.getDate(),
            jsDate.getHours(),
            jsDate.getMinutes(),
            jsDate.getSeconds()
        );


    } catch (error) {
        console.error('Error converting to CalendarDate:', error);
        return undefined;
    }
};

const convertFromCalendarDate = (value: DateValue | undefined): Timestamp => {
    if (!value) return Timestamp.now();

    let jsDate: Date;

    if ('hour' in value && 'minute' in value) {
        jsDate = new Date(
            value.year,
            value.month - 1,
            value.day,
            value.hour,
            value.minute,
            'second' in value ? value.second : 0
        );
    } else {
        jsDate = new Date(value.year, value.month - 1, value.day);
    }

    return Timestamp.fromDate(jsDate);
};

const internalValue = useVModel(
    props,
    'modelValue',
    emits,
    {
        passive: true,
        defaultValue: props.defaultValue,
    }
);

const calendarValue = computed({
    get: () => convertToCalendarDate(internalValue.value),
    set: (newValue: DateValue | undefined) => {
        internalValue.value = convertFromCalendarDate(newValue);
    }
});
</script>

<template>
    <DatePickerRoot v-model="calendarValue" :disabled="disabled" :locale="userLocale" v-bind="_options">
        <DatePickerField v-slot="{ segments }" :class="cn(
            'flex w-full select-none items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-[color,box-shadow]',
            'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
            'data-invalid:border-destructive data-invalid:ring-destructive/20',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            props.class
        )">
            <div class="flex items-center flex-1 gap-1">
                <template v-for="item in segments" :key="item.part">
                    <DatePickerInput v-if="item.part === 'literal'" :part="item.part" class="text-muted-foreground">
                        {{ item.value }}
                    </DatePickerInput>
                    <DatePickerInput v-else :part="item.part"
                        class="rounded px-0.5 tabular-nums focus:outline-none focus:bg-accent data-placeholder:text-muted-foreground">
                        {{ item.value }}
                    </DatePickerInput>
                </template>
            </div>

            <DatePickerTrigger
                class="ml-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded p-1">
                <Icon icon="radix-icons:calendar" class="h-4 w-4 text-muted-foreground" />
            </DatePickerTrigger>
        </DatePickerField>

        <DatePickerContent :side-offset="4"
            class="z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade">
            <DatePickerArrow class="fill-popover stroke-border" />
            <DatePickerCalendar v-slot="{ weekDays, grid }">
                <DatePickerHeader class="flex items-center justify-between mb-4">
                    <DatePickerPrev
                        class="inline-flex items-center justify-center rounded-md bg-transparent w-7 h-7 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <Icon icon="radix-icons:chevron-left" class="w-4 h-4" />
                    </DatePickerPrev>

                    <DatePickerHeading class="text-sm font-medium" />

                    <DatePickerNext
                        class="inline-flex items-center justify-center rounded-md bg-transparent w-7 h-7 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <Icon icon="radix-icons:chevron-right" class="w-4 h-4" />
                    </DatePickerNext>
                </DatePickerHeader>

                <div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <DatePickerGrid v-for="month in grid" :key="month.value.toString()"
                        class="w-full border-collapse select-none space-y-1">
                        <DatePickerGridHead>
                            <DatePickerGridRow class="mb-1 flex w-full justify-between">
                                <DatePickerHeadCell v-for="day in weekDays" :key="day"
                                    class="w-8 rounded-md text-xs font-medium text-muted-foreground">
                                    {{ day }}
                                </DatePickerHeadCell>
                            </DatePickerGridRow>
                        </DatePickerGridHead>
                        <DatePickerGridBody>
                            <DatePickerGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`"
                                class="flex w-full">
                                <DatePickerCell v-for="weekDate in weekDates" :key="weekDate.toString()"
                                    :date="weekDate">
                                    <DatePickerCellTrigger :day="weekDate" :month="month.value"
                                        class="relative flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-selected:bg-primary data-selected:text-primary-foreground data-selected:font-medium data-outside-view:text-muted-foreground/50 data-unavailable:pointer-events-none data-unavailable:text-muted-foreground/30 data-unavailable:line-through before:absolute before:top-[3px] before:hidden before:h-1 before:w-1 before:rounded-full before:bg-accent-foreground data-today:before:block data-selected:before:bg-primary-foreground" />
                                </DatePickerCell>
                            </DatePickerGridRow>
                        </DatePickerGridBody>
                    </DatePickerGrid>
                </div>
            </DatePickerCalendar>
        </DatePickerContent>
    </DatePickerRoot>
</template>