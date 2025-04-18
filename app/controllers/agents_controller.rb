class AgentsController < ApplicationController
  def index
    @agents = Agent.all
    respond_to do |format|
      format.json { render json: @agents }
    end
  end

  def events
    @events = Event.where(agent_id: params[:id]) || []
    respond_to do |format|
      format.json { render json: @tasks }
    end
  end
end
