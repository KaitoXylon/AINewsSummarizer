export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  image: string;
  selected: boolean;
  customImage?: File;
}

export interface AIResponse {
  news: {
    title: string;
    summary: string;
    link: string;
    image: string;
  }[];
}