# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)

10.times do
  Agent.create(
    name: Faker::Name.name,
    email: Faker::Internet.email
  )
end

15.times do
  Event.create!(
    title: Faker::Lorem.sentence,
    starts_at: DateTime.current,
    ends_at: DateTime.current + 1.hour,
    color: "#%06x" % (rand * 0xffffff), # Random hex color
    all_day: false,
    recurring: nil,
    parent_id: nil
  )
end
