import { Context } from "hono";

// Define context variables type
export type Variables = {
  user?: {
    id: string;
    email: string;
  };
};

// AuthContext extends Hono's Context with Variables
export type AuthContext = Context<{
  Variables: Variables;
}>;
