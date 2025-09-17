export interface CourseIdParam {
    id?: string; // make optional
  }
  
  export interface ChapterIdParam extends CourseIdParam {
    chapterId?: string; // optional
  }
  
  export interface LectureIdParam extends ChapterIdParam {
    lectureId?: string; // optional
  }
  