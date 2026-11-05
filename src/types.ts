export interface WeatherResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
    is_day: number;
  };
}

export interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  views: number;
}

export interface NewsResponse {
  posts: Post[];
  total: number;
}

export interface Comment {
  id: number;
  body: string;
  likes: number;
  user: { username: string };
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}