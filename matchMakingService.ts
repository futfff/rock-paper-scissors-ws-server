import axios from "axios";
import { Server, Socket } from "socket.io";

const API_URL = "http://localhost:3000/api";

interface UserDtoI {
  name: string;
  id: number;
  rating: number;
}

interface MatchMakingServiceI {
  users: UserDtoI[];
  createGame: (firstUserId: number, secondUserId: number) => void;
  join: (user: UserDtoI) => void;
  leave: (userId: number) => void;
}

export class MatchMakingService implements MatchMakingServiceI {
  socket: Server;
  users: UserDtoI[] = [];

  constructor(socket: Server) {
    this.socket = socket;
  }
  async createGame(firstUserId: number, secondUserId: number) {
    this.users = this.users.filter((u) => u.id !== firstUserId && u.id !== secondUserId);
    //creating game
    console.log("creating game");
    const data = await axios.post<{ id: number }>(`${API_URL}/game/create`, {
      ids: [firstUserId, secondUserId],
    });
    this.socket
      .to("user" + firstUserId)
      .emit("matchFind", { id: data.data.id });
    this.socket
      .to("user" + secondUserId)
      .emit("matchFind", { id: data.data.id });
  }

  join(user: UserDtoI) {

    this.users = this.users.filter((u) => u.id !== user.id);

    let l = 0;
    let r = this.users.length - 1;

    while (l <= r) {
      let mid = Math.floor((l + r) / 2);
      if (this.users[mid].rating <= user.rating) {
        l = mid + 1;
      } else {
        r = mid - 1;
      }
    }
    this.users.splice(l, 0, user);
    
    console.log(this.users.map((u) => ({id : u.id , rating: u.rating})))

    const left = this.users[l - 1];
    const right = this.users[l + 1];
    let ratingRange = 300;
    let candidate;

    if (left) {
      const leftRatingRange = Math.abs(user.rating - left.rating);
      if (leftRatingRange <= ratingRange) {
        candidate = "left";
        ratingRange = leftRatingRange;
      }
    }

    if (right) {
      if (Math.abs(user.rating - right.rating) <= ratingRange) {
        candidate = "right";
      }
    }

    if (candidate) {
      if (candidate === "left") {
        this.createGame(left!.id, user.id);
      } else {
        this.createGame(user.id, right!.id);
      }
    }
  }

  leave(userId: number) {
    this.users.filter((u) => u.id !== userId);
  }
}
