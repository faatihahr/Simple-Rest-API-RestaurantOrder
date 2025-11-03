export interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
}

export const posts: Post[] = [
    {
        id: 1,
        title: "First Post",
        content: "This is the content of the first post.",
        author: "Faatihah",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 2,
        title: "Second Post",
        content: "This is the content of the second post.", 
        author: "Faatihah",
        createdAt: new Date(),
        updatedAt: new Date(),
    }
]