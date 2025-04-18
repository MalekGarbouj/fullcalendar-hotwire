Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  resources :events do
    member do
      post :assign
      get :unassign
    end
  end

  resources :agents do
    member do
      get :tasks
    end
  end

  # Defines the root path route ("/")
  root "events#index"
end
