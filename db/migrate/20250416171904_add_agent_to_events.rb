class AddAgentToEvents < ActiveRecord::Migration[8.0]
  def change
    add_reference :events, :agent, foreign_key: true
  end
end
