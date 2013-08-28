class Metric
  include DataMapper::Resource
  property :id, Serial, :key => true
  property :date, DateTime, :required => true
  property :package_name, String, :required => true
  property :dist, String
  property :package_type, String
  property :jenkins_build_time, Float
  property :package_build_time, Float
  property :build_user, String
  property :build_team, String
  property :build_loc, Text
  property :version, String
  property :pe_version, String
  property :success, Boolean
  property :build_log, Text, :length => 99999999
end

# Perform basic sanity checks and initialize all relationships
# Call this when you've defined all your models
DataMapper.finalize

# automatically create the post table
Metric.auto_upgrade!
Metric.raise_on_save_failure = true
