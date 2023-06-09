export const configRoutes = {
  home: "/",

  auth: {
    getStarted: `/auth/get-started`,
    signIn: `/auth/sign-in`,
    signOut: `/auth/sign-out`,
    invalidSubscription: `/auth/invalid-subscription`,
    forgotPassword: `/auth/forgot-password`,
    resetPassword: `/auth/reset-password`,
    stripeCheckoutSuccess: `/auth/stripe-checkout-success?session_id={CHECKOUT_SESSION_ID}`,
  },

  app: {
    current: "/app",

    profile: "/app/profile",

    mesocycles: {
      view: (id: string) => `/app/mesocycles/${id}`,
      viewHistory: (id: string) => `/app/mesocycles/${id}/history`,
      list: `/app/mesocycles`,
      new: {
        step1: `/app/mesocycles/new`,
        step2: (id: string) => `/app/mesocycles/new/design/${id}`,
      },
    },

    exercises: {
      view: (id: string) => `/app/exercises/${id}`,
      list: `/app/exercises`,
      new: `/app/exercises/new`,
    },
  },
};
