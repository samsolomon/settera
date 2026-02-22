export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member";
  created: Date;
}

export const demoUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@feedback-notes.com",
    role: "Admin",
    created: new Date("2026-01-05"),
  },
  {
    id: "2",
    name: "Jake Torres",
    email: "jake@feedback-notes.com",
    role: "Member",
    created: new Date("2026-01-12"),
  },
  {
    id: "3",
    name: "Maria Chen",
    email: "maria@feedback-notes.com",
    role: "Member",
    created: new Date("2026-01-18"),
  },
  {
    id: "4",
    name: "Review User",
    email: "reviewer@feedback-notes.com",
    role: "Member",
    created: new Date("2026-01-25"),
  },
  {
    id: "5",
    name: "Sam Solomon",
    email: "sam@feedback-notes.com",
    role: "Admin",
    created: new Date("2026-02-01"),
  },
  {
    id: "6",
    name: "Priya Patel",
    email: "priya@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-03"),
  },
  {
    id: "7",
    name: "Leo Nguyen",
    email: "leo@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-05"),
  },
  {
    id: "8",
    name: "Dana Kim",
    email: "dana@feedback-notes.com",
    role: "Admin",
    created: new Date("2026-02-06"),
  },
  {
    id: "9",
    name: "Omar Hassan",
    email: "omar@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-08"),
  },
  {
    id: "10",
    name: "Ava Martinez",
    email: "ava@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-09"),
  },
  {
    id: "11",
    name: "Ravi Sharma",
    email: "ravi@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-10"),
  },
  {
    id: "12",
    name: "Emma Johansson",
    email: "emma@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-11"),
  },
  {
    id: "13",
    name: "Carlos Reyes",
    email: "carlos@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-12"),
  },
  {
    id: "14",
    name: "Sophie Laurent",
    email: "sophie@feedback-notes.com",
    role: "Admin",
    created: new Date("2026-02-13"),
  },
  {
    id: "15",
    name: "Yuki Tanaka",
    email: "yuki@feedback-notes.com",
    role: "Member",
    created: new Date("2026-02-14"),
  },
];
