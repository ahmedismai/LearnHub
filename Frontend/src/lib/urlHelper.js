export const getFullUrl = (path, type = "Course") => {
  if (!path || path === "No Image Available") return "/placeholder.svg";
  
  const cleanPath = path.replace(/\\/g, "/");

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }


  const hasFolderStructure = 
    cleanPath.startsWith("Images/") || 
    cleanPath.startsWith("Videos/") || 
    cleanPath.startsWith("Files/");

  if (hasFolderStructure) {
    return `/${cleanPath}`;
  }

  const folder =
    type === "Course"
      ? "Images/Course"
      : type === "Category"
        ? "Images/Category"
        : type === "Lesson"
          ? "Videos/Lesson"
          : "Files/Lesson";
  
  return `/${folder}/${cleanPath}`;
};
