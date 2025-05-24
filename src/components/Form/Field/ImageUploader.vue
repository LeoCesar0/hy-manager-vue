<script setup lang="ts">
import { useField } from "vee-validate";
import { XIcon, UploadIcon, ImageIcon } from "lucide-vue-next";
import { cn } from "~/lib/utils";
import type { AvatarProps } from "~/components/Avatar/Avatar.vue";
import type { IFile, IFileMin } from "~/@schemas/models/file";
import type { Nullish } from "~/@types/helpers";

export type IImageUploaderProps = {
  showPreview?: boolean;
  acceptedFileTypes?: string[];
  onFileUploaded?: (file: IFile) => void;
  onFileSelected?: (file: File) => void;
  avatarDesign?: boolean;
  avatarProps?: AvatarProps;
};

type IProps = {
  name: string;
  disabled?: boolean;
  class?: string;
} & IImageUploaderProps;

const props = withDefaults(defineProps<IProps>(), {
  showPreview: true,
  acceptedFileTypes: () => [".jpg", ".jpeg", ".png", ".webp"],
  avatarDesign: false,
  avatarProps: () => ({
    size: "xl",
    variant: "muted",
    alt: "",
  }),
});

// Changed from string to IFileMin
const { value, meta, errorMessage, handleChange } = useField<Nullish<IFileMin>>(
  props.name
);
const fileInputRef = ref<HTMLInputElement | null>(null);

const { uploadFiles, getFileById } = useFile();

const isLoadingFile = ref(false);
const selectedFile = ref<File | null>(null);

const formIsLoading = inject<Ref<boolean> | undefined>("formIsLoading");

watch(isLoadingFile, (isUploading) => {
  if (formIsLoading) {
    formIsLoading.value = isUploading;
  }
});

const handleFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  // Get the first file since this is a single image uploader
  const file = input.files[0];
  selectedFile.value = file;

  if (props.onFileSelected) {
    props.onFileSelected(file);
  }

  // Automatically upload the file
  uploadSelectedFile();
};

const uploadSelectedFile = async () => {
  if (!selectedFile.value) return;

  try {
    isLoadingFile.value = true;

    // Upload the file - the actual useFile.uploadFiles accepts an array
    const response = await uploadFiles([selectedFile.value]);

    if (response.data && !response.error && response.data.length > 0) {
      const uploadedFileData = response.data[0];

      if (props.onFileUploaded) {
        props.onFileUploaded(uploadedFileData);
      }

      // Store the uploaded file

      const fileMin: IFileMin = {
        name: uploadedFileData.name,
        size: uploadedFileData.size,
        type: uploadedFileData.type,
        url: uploadedFileData.s3Url,
      };

      // Update the form field value with IFileMin object
      handleChange(fileMin);

      // Clear selected file
      selectedFile.value = null;
      if (fileInputRef.value) {
        fileInputRef.value.value = "";
      }
    }
  } catch (error) {
    console.error("Error uploading image:", error);
  } finally {
    isLoadingFile.value = false;
  }
};

const openFileSelector = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const removeFile = () => {
  // Set to null instead of empty string
  handleChange(null);
};

const acceptedFileTypesAsString = computed(() => {
  return props.acceptedFileTypes?.join(",");
});

const imagePreviewUrl = computed(() => {
  return value.value?.url || "";
});
</script>

<template>
  <div :class="cn('w-full space-y-2', props.class)">
    <div
      v-if="!value || !showPreview"
      :class="
        cn(
          'p-4 flex flex-col items-center justify-center gap-2 cursor-pointer',
          {
            'border border-dashed rounded-md': !avatarDesign,
            'bg-muted/10 hover:bg-muted/20': !disabled && !avatarDesign,
            'border-destructive': !!errorMessage && !avatarDesign,
            'border-input': !errorMessage && !avatarDesign,
            'opacity-50 cursor-not-allowed': disabled,
          }
        )
      "
      @click="openFileSelector"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        :multiple="false"
        :accept="acceptedFileTypesAsString"
        @change="handleFileSelection"
      />

      <template v-if="!avatarDesign">
        <ImageIcon class="h-6 w-6 text-muted-foreground" />
        <div class="text-center">
          <p class="text-sm font-medium">Click to upload image</p>
          <p class="text-xs text-muted-foreground">
            <!-- or drag and drop -->
            <span v-if="acceptedFileTypesAsString">
              ({{ acceptedFileTypesAsString.replace(/\./g, "") }})
            </span>
          </p>
        </div>
      </template>
      <template v-else>
        <div>
          <Avatar :src="imagePreviewUrl" v-bind="avatarProps" />
        </div>
      </template>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoadingFile" class="flex items-center justify-center py-2">
      <Loading :is-loading="true" size="md" />
      <span class="ml-2 text-sm text-muted-foreground">Uploading...</span>
    </div>

    <!-- Image preview -->
    <div
      v-if="value && showPreview && !isLoadingFile"
      class="relative rounded-md overflow-hidden p-4"
      :class="{
        'flex items-center justify-center': avatarDesign,
      }"
    >
      <Avatar v-if="avatarDesign" :src="imagePreviewUrl" v-bind="avatarProps" />
      <img
        v-else
        :src="imagePreviewUrl"
        :alt="value.name"
        class="w-full max-h-64 min-h-64 object-contain"
      />
      <div
        class="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity"
      />
      <UiButton
        variant="destructive"
        size="icon"
        class="absolute top-2 right-2"
        @click.stop="removeFile()"
        :disabled="disabled"
      >
        <XIcon class="h-4 w-4" />
      </UiButton>
    </div>
  </div>
</template>
