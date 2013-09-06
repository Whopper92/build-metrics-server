Build Board
====================

A web based dashboard to receive and visualize statistics from
a large number of package builds.

##### Table of Contents
[Installation](#installation)  
[Dependencies](#dependencies)  
[Getting Data](#data)  
[Maintenance](#maintenance)  
[Glossaries](#glossaries)  


<a name="installation"/>
## 1. Installation and Setup

* **Package**  
The Build Board comes pre-configured with the rake task `package:bootstrap`, which automatically clones the [Puppet Labs packaging repository](https://github.com/puppetlabs/packaging). Once this has been done, a Debian package can be generated for fast installation by running the task `package:deb`. This will build a package and place it into the `pkg` directory within the root of the project, which can be installed using `dpkg`.

* **Puppet Module**  
The project Puppet module, which can be found [here](https://github.com/Whopper92/puppetlabs-buildboard-module) is meant for internal Puppet Labs use, and is currently setup to run in production.

* **Configuration**  
This app uses a simple [configuration file](#config-file) to store sensitive database login information. This file is installed into `/etc/db.conf` by default, and must be configured with the appropriate credentials before the Build Board server can connect.

The application also includes an [Apache vhost configuration](#vhost-config), which is installed by default and can be manually configured.


<a name="dependencies"/>
## 2. Dependencies

* rubygem sinatra (1.3.3)
* rubygem sinatra-contrib (1.3.2)
* rubygem passenger (4.0.14)
* rubygem dm-postgres-adapter (1.2.0)
* rubygem datamapper (1.2.0)

<a name="data"/>
## 3. Getting the Data

By default, this app utilizes RubyGem [DataMapper](http://datamapper.org/) on top of a PostgreSQL database. The database
itself may be swapped for a different type so long as it is compatible with DataMapper.

### Configuring a database


The default data store for this app is a PostgreSQL database, which can be run either on the same host as the webserver or remotely.  This database holds two tables, one of which details individual builds while the other contains information about shipped packages.

The schema of the first table exists as follows, where each row represents a single package build:

<pre>
       Column       |          Type          |                      Modifiers                       | Storage  | Description
--------------------+------------------------+------------------------------------------------------+----------+-------------
 date               | character varying(128) |                                                      | extended |
 package_name       | character varying(128) |                                                      | extended |
 dist               | character varying(128) |                                                      | extended |
 build_user         | character varying(128) |                                                      | extended |
 build_loc          | character varying(128) |                                                      | extended |
 version            | character varying(128) |                                                      | extended |
 pe_version         | character varying(128) |                                                      | extended |
 id                 | integer                | not null default nextval('metrics_id_seq'::regclass) | plain    |
 success            | boolean                |                                                      | plain    |
 build_log          | text                   |                                                      | extended |
 jenkins_build_time | double precision       |                                                      | plain    |
 package_build_time | double precision       |                                                      | plain    |
 package_type       | text                   |                                                      | extended |
</pre>

The second, 'ships' table is built as follows:
<pre>
  Column   |          Type          |                     Modifiers                      | Storage  | Description
------------+------------------------+----------------------------------------------------+----------+-------------
 id         | integer                | not null default nextval('ships_id_seq'::regclass) | plain    |
 date       | character varying(128) | not null                                           | extended |
 version    | character varying(128)  |                                                    | extended |
 pe_version | character varying(128)  |                                                    | extended |
 is_rc      | boolean                |                                                    | plain    |
 package    | character varying(128)  |                                                    | extended |
</pre>

See the [database column glossary](#database-glossary) for information on the purpose of each data point.

DataMapper initializes its connection to the database in the main server file, `server.rb`, using connection parameters from the application [configuration file](#installation):

    DataMapper.setup(:default, "postgres://#{config['username']}:#{config['password']}@#{config['hostname']} 
                     #{config.has\_key?('port') ? ":#{config['port']}" : ""}/#{config['database']}")

Any database type compatible with DataMapper may be used. To swap databases, the correct DataMapper adapter must be required in the server file, and the database setup line must be updated.

#### Retrieving data

In general, any package building script or task can be modified to collect the needed data to work with the build board.
At the minimum, a date, package name, distribution, and package build time are required.

In order to ensure every graph present on the overview display is functional, every database column will need to be filled
for each package build.

All data must be sent to the server's listening service as an HTTP POST request. By default, `/overview/metrics` is the route which accepts these requests and causes the server to automatically stores received data. The `metrics_client.rb` file within the examples directory contains a Ruby implementation of a valid POST request.

See the `server.rb` entry within the [file glossary](#file-glossary) for an in-depth description of the HTTP listener.


##### Using the Puppet Labs Packaging Repo

Currently, as the Build Board is intended to be used within Puppet Labs internal infrastructure, builds are kicked off
through the rake tasks found in the [packaging](https://github.com/puppetlabs/packaging) respository.

###### From local builds

The retrieval of data paramters from local build tasks is fairly simple. Most parameters already exist as build object variables, with the
exception of `package_type` and `package_build_time`, which are collected with additional metrics gathering code within each build task.

Currently, it is not always possible to determine if a local build has succeeded or failed. In some cases, exception handling within
the build rake task allows the `success` parameter to be altered if an error occurs with the process of a build tool. Also note that
there is currently no method to capture a build log for local builds.

Once a task is known to be local, and not associated with a remote Jenkins job, the `add_metrics` method is called (found within the file `30_metrics.rake`)
using the collected data as arguments. Once the task is complete, the `post_metrics` method is called which sends an HTTP post request to the `/overview/metrics`
route of the Build Board server, which causes the data to be permanently stored. Note that the route which the data is sent is defined in the [build-data](https://github.com/puppetlabs/build-data) repository.

###### From Jenkins remote builds

There are two types of Jenkins packaging jobs that the Build Board currently supports: standard static jobs and dynamic matrix jobs.


* **Static jobs:**
  The packaging repo allows for single builds to be launched via Jenkins through the `pl:jenkins` and `pe:jenkins` namespaces.
  When such a task is initiated, the tasks included in `jenkins.rake` submit a job to Jenkins via curl, which includes a set
  of parameters that Jenkins can use. One of these parameters is a string of metrics, including several data items which
  can't be gathered from within Jenkins itself.

  The Jenkins job runs the appropriate build tasks as decided by the type of build. Since this job is sent to a known and
  permanent Jenkins project, the project can be pre-configured with a Groovy post-build script in place.

  Once the build has completed, the Jenkins Groovy Post-build plugin is used to gather and format all needed data points
  and send them to the `/overview/metrics` route of the metrics server with an HTTP post request. Note that the Groovy script
  used to accomplish this is included in this repository, and is slightly different than the script needed for dynamic Jenkins builds.
  It can be seen [here.](#groovyScript)

* **Dynamic jobs:**
  When the `uber_build` task is initiated, a dynamic Jenkins matrix job is created. The dynamic Jenkins task submits
  an XML template of all parameters and configuration settings needed to build the matrix. Along with these parameters,
  the Groovy post-build script is also sent, which collects the data in nearly the same was as it does for the static job, with a few minor exceptions.

<a name="maintenance"/>
## 4. Maintenance

* **Application Architecture and File Descriptions**

    Build Board utilizes RubyGem [Sinatra](http://www.sinatrarb.com/) as its web backend, which in turn leans on
    [DataMapper](http://datamapper.org/) to interact with the central PostgreSQL databse.

    The frontend is built with several HTML templates, CSS, and JavaScript files.
    [Twitter Bootstrap](http://getbootstrap.com/) is also heavily used for styling and functionality.

    All graphs and charts utilize the graphing library [D3.js](http://d3js.org/).


The Build Board application structure is as follows. See the [file glossary](#file-glossary) for descriptions
of the purpose and contents of each file.

<pre>
├── conf
│   └── db.conf.example
├── config.ru
├── examples
│   └── metrics_client.rb
├── ext
├── Gemfile
├── models
│   └── metric.rb
├── public
│   ├── css
│   │   ├── bootstrap.css
│   │   ├── bootstrap.min.css
│   │   ├── bootstrap-responsive.css
│   │   ├── bootstrap-responsive.min.css
│   │   ├── d3.css
│   │   ├── general.css
│   │   └── overview.css
│   ├── img
│   │   ├── glyphicons-halflings.png
│   │   ├── glyphicons-halflings-white.png
│   │   └── puppetlabslogo.png
│   └── js
│       ├── bootstrap.js
│       ├── bootstrap.min.js
│       ├── commonGraphFunctions.js
│       ├── d3.v3
│       │   ├── d3.v3.js
│       │   ├── d3.v3.min.js
│       │   └── LICENSE
│       ├── jquery-2.0.3.min.js
│       ├── overviewPackageSparkline.js
│       ├── overviewTables.js
│       ├── recentBuildsModal.js
│       ├── standardHistogram.js
│       └── standardLineGraph.js
├── rakefile
├── README.md
├── server.rb
├── spec
│   ├── server_spec.rb
│   └── spec_helper.rb
└── views
    ├── layout.erb
    ├── notfound.erb
    ├── overview.erb
    ├── package.erb
    └── typeStats.erb
</pre>

* **Working with the backend**

The backend of the Build Board is found in the file `server.rb`, in the root
of the repository. This file is responsible for running the server and defining every HTTP route.

Before routes are defined, the file loads the configuration file [db.conf](`#installation`) which is required to connect to the database.

All database lookups to stock graphs with data occur here.
Each route has specific lookups relevant to the content which it shows. Each uses DataMapper to collect the raw
data, which is often then converted into convenient arrays or hashes to parse with JavaScript in the front end.

For example, one such lookup is used to gather all information about the latest six builds:

    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :package_build_time.not => nil)

Once defined, this data becomes available in the erb templates used to create content for each route, which in turn
send it to JavaScript functions with the purpose of rendering graphs.

Along with defining every route, the server file also houses the HTTP listener which accepts build data from local
or Jenkins builds and stores them in the database using DataMapper. This listener is simply defined as a post route
on `/overview/metrics`.

* **Working with the frontend**

The frontend of the Build Board consists of erb HTML templates, CSS styling and JavaScript client-side code for data
rendering and interactivity. The HTML templates can be found in the `views/` directory, and CSS and JavaScript are
located in the `public/` directory.

##### HTML and CSS
  Much of the structuring used within the HTML of the dashboard is based around the [Twitter Bootstrap fluid layout](http://getbootstrap.com/css/#grid) grid system.
  The main view, for example, consists of two instances of `row-fluid` with spans of various sizes to represent columns. The navigation bar and
  footer seen on every route are also styled exclusively with bootstrap.

  The fluid layout allows the application to scale depending on screen resolution without compromising the visibility of the data.

  In general, every graph is contained inside of a basic container div, including nested title and content divs.

  Note that the layout template is applied to every route. All JavaScript and CSS files must be linked in this file.

##### JavaScript
  For the most part, JavaScript functions are limited to D3 graph generation, along with tooltip and modal creation.
  Most are fairly simple and easily modified.

  Each function contains data arguments, which originate from variables in the Sinatra backend that are then used in
  the HTML templates to call the appropriate JavaScript functions with the appropriate data. For example, the following call is used to generate a sparkline for the `recent builds` section:

    <script type='text/javascript'>
        createRecentSparkline( <%= time_array %>, <%= "sparkline#{row.id}" %> )
    </script>

Here, `time_array` is a ruby variable defined within `server.rb` and made available to the `/overview` route.
    
<a name="glossaries"/>
### Glossary

[Database Column Glossary](#database-glossary)  
[File Glossary](#file-glossary)  

<a name="database-glossary"/>
#### Database Column Glossary

##### Metrics
* `date`  
A Unix timestamp describing the time of building.

* `package_name`  
The name of the package which was built.

* `dist`  
The distribution for which the package was built. (Wheezy, el5, sles11, and so on).

* `build_user`  
The user which initiated the package build.

* `build_loc`  
The hostname of the machine upon which the package was built

* `version`  
The version of the package

* `pe_version`  
*PL Specific*: the Enterprise version of the package.

* `id`  
The unique identifier for the build (primary key).

* `success`  
Describes the result of the build, whether it be a success or a failed build. This parameter is a boolean value, where 'true' indicates a successful build.

* `build_log`  
The complete log of the build in text.

* `jenkins_build_time`  
The number of seconds that a Jenkins package building job took to complete the build.

* `package_build_time`  
The number of seconds that package building tools took to complete the build.

##### Ships
* `date`  
A Unix timestamp describing the time of shipping.

* `package`  
The name of the package which was shipped.

* `version`  
The version of the package when it was shipped.

* `pe_version`  
The Puppet Enterprise version of the package, if applicable.

* `is_rc`  
A boolean describing whether the shipped package was in RC or final state.
<a name="file-glossary"/>
#### File Glossary by Directory

* `config.ru`  
A standard Sinatra configuration file that allows the server to run.

* `favicon.ico`  
The Puppet Labs logo image, used as the favicon icon which can be seen in the browser
tab and address bars.

* `server.rb`  
The core of the Build Board application. Contains route definitions for every view of
the dashboard and handles every database lookup through DataMapper.

<a name="config-file"/>
##### `conf/`
* `db.conf.example`  
An example configuration file including each required database connection parameter.

<a name="vhost-config"/>
* `metrics.delivery.puppetlabs.net`  
The Apache Vhost configuration.

##### `examples/`  
* `metrics_client.rb`  
An example Ruby implementation of a valid HTTP POST request to store build data.

##### `ext/`
* `build_defaults.yaml`  
A configuration file used for linking the project to the Puppet Labs packaging repository.

* `debian/`  
Files needed to build Debian packages. Contents of this directory are used by the task `package:deb`.

* `project_data.yaml`  
Another configuration file used with the Puppet Labs packaging repository.

##### `public/css/`
* `bootstrap.css`, `bootstrap.min.css`, `bootstrap-responsive.css` and `bootstrap-responsive.min.css`  
Style sheets used for all bootstrap related elements. These are not to be edited themselves. Changes that
need to be made to bootstrap default styling should be done by overriding the values found in these files
with custom CSS classes.

* `d3.css`  
Contents: all styling directly related to D3 generated graphs and charts. Elements that are styled here include
items such as graph axes, labels, and histogram bar width.

* `general.css`  
Contents: general purpose CSS classes not specific to any single route

* `overview.css`  
Contents: all styling used for the /overview route, which is the main dashboard display.

* `package.css`  
Contents: Styling for the individual package view.

* `packageSelection.css`  
Contents: Styling for the package selection screen.

* `packageType.css`  
Contents: Styling for the package type view.

* `toolTips.css`  
Contents: Styling for tooltips and modal popups, which are present on every view.

* `users.css`  
Contents: Styling for the user dashboard view.

##### `models/`
* `metric.rb`  
The main DataMapper database configuration file. Contains a representation of the database schema. If columns are
added to the application database, they will also need to be added here.

##### `public/img/`
* `glyphicons-halflings.png` and `glyphicons-halflings-white.png`  
Glyphicons are images that can be accessed via bootstrap attributes. A few are used on various buttons throughout
the dashboard.

##### `public/js/`
Note that at the end of development, custom JavaScript files may be combined to improve performance and reduce
the weight of network requests on the dashboard.

* `bootstrap.js` and `bootstrap.min.js`  
JavaScript functions used internally by bootstrap. These should not be edited.

* `commonGraphFunctions.js`  
JavaScript functions which are abstract enough to apply to any D3 graph present in the app. Includes Y Axes and tooltip popups.
Each relies heavily on D3.js.

* `d3/d3.v3.js` and `d3.v3.min.js`  
The D3 graphing library. These are used heavily to create all of the data visualizing graphs seen on the dashboard.

* `historicalBuildLogModal.js`  
Code which generates the historical build log, which can be triggered on any view.

* `jquery-2.0.3.min.js`  
The JQuery JavaScript library. This is required by bootstrap.

* `overviewPackageSparkline.js`  
Responsible for creating a sparkline without Axes. Primarily used in the recent builds section of the overview display.

* `tableFunctions.js`   
Creates tooltip popups for overview hover effects on tables.

* `recentBuildsModal.js`  
Constructs the modal which is triggered by clicking on one of the recent builds in the recent build graphic on the
overview display. This includes both the primary modal and the build log modal which is accessed by clicking the
'build log' button.

* `standardHistogram.js`  
JavaScript code heavily leaning on D3.js to create a standard histogram with data provided as arguments. The functions are
general purpose and can be used to create additional graphs as needed, simply by providing the appropriate data.

* `standardLineGraph.js`  
Much like the standard histogram functions, this file contains functions needed to create a general purpose line graph.

##### `Spec/`

* `spec_helper.rb`  
A standard boilerplate as part of the spec testing framework

* `server_spec.rb`  
Contains spec tests for the Sinatra server file.

##### `Views/`

* `layout.erb`  
Contains the bootstrap navbar and footer which is present on every route the app uses.

* `notfound.erb`  
A template for displaying upon a route being requested that doesn't exist.

* `overview.erb`  
The template which contains all HTML defining the overview dashboard display.

* `package.erb`  
The template defining the individual package dashboard view.

* `packageSelection.erb`  
The template which creates the package selection view.

* `pkgTypeBoard.erb`  
The template containing the structure of the 'package type' dashboard view.

* `recentBuildsTable.erb`  
A template containing HTML defining the 'recent builds' table, which is used dynamically
across each of the main vies.

* `tooltips.erb`  
The template which contains the structuring of all tooltips and modal popups.

* `users.erb`  
A templaet which contains HTML structuring for the individual user view, a dashboard which
displays statistics for each build user.

##### `Other`

<a name="groovyScript"/>
* `Groovy Postbuild Script`  
The following is the postbuild script which must be added to the configuration of a static Jenkins job
in order to collect metrics. Along with this script, the job must also be configured with a string parameter
named 'METRICS'.

<pre>
import java.util.regex.Matcher
import java.util.regex.Pattern
import java.net.HttpURLConnection
import java.util.Date;

def get_jenkins_build_time() {
    start_time  = manager.build.getStartTimeInMillis()
    end_time    = new Date().getTime()
    return String.valueOf((end_time - start_time)/1000)
}

// Assemble metrics to post to build metrics server

app_server    = "http://metrics.delivery.puppetlabs.net:4567/overview/metrics"
task_metrics  = manager.build.getEnvironment(manager.listener)['METRICS']
charset       = "UTF-8"

// Maintain backwards compatibility
if ( task_metrics == null) {
    build_user  = "N/A"
    version     = "N/A"
    pe_version  = "N/A"
    dist        = "N/A"
    build_team  = "N/A"
} else {
    build_user  = task_metrics.split("~")[0]
    version     = task_metrics.split("~")[1]
    pe_version  = task_metrics.split("~")[2]
    dist        = task_metrics.split("~")[3]

    // Also needed for backwards compatibility
    if(task_metrics.split("~").length == 5) {
        build_team = task_metrics.split("~")[4]
    } else {
        build_team = "N/A"
    }
}

matcher = manager.getLogMatcher(/(?:Finished building in:) ([\d]+\.?[\d]*)/)
if (matcher != null) {
  package_build_time = matcher[0][1]
} else {
  package_build_time = "N/A"
}

jenkins_build_time  = get_jenkins_build_time()
package_type         = manager.build.getEnvironment(manager.listener)['BUILD_TYPE']
package_name        = manager.build.getEnvironment(manager.listener)['PROJECT']
build_loc           = manager.build.getEnvironment(manager.listener)['NODE_NAME']
build_log           = "${manager.build.getEnvironment(manager.listener)['BUILD_URL']}" + "consoleText"
success             = String.valueOf(manager.build.result)

String query = String.format("package_name=%s&dist=%s&package_type=%s&build_user=%s&build_team=%s&build_loc=%s&version=%s&pe_version=%s&success=%s&build_log=%s&jenkins_build_time=%s&package_build_time=%s",
     URLEncoder.encode(package_name, charset),
     URLEncoder.encode(dist, charset),
     URLEncoder.encode(package_type, charset),
     URLEncoder.encode(build_user, charset),
     URLEncoder.encode(build_team, charset),
     URLEncoder.encode(build_loc, charset),
     URLEncoder.encode(version, charset),
     URLEncoder.encode(pe_version, charset),
     URLEncoder.encode(success, charset),
     URLEncoder.encode(build_log, charset),
     URLEncoder.encode(jenkins_build_time, charset),
     URLEncoder.encode(package_build_time, charset))

// Make sure the server is listening before attempting to post data

URLConnection connection = null
serverAlive = false
try {
    URL u       = new URL(app_server);
    connection  = (HttpURLConnection) u.openConnection();
    connection.setRequestMethod("GET");
    int code    = connection.getResponseCode();
    serverAlive = true
    connection.disconnect();

} catch (MalformedURLException e) {
    serverAlive = false
    e.printStackTrace()

} catch (IOException e) {
    serverAlive = false
    e.printStackTrace()

} finally {
    if (serverAlive == true) {
        connection = new URL(app_server).openConnection()
        connection.setDoOutput(true) // Triggers POST.
        connection.setRequestProperty("Accept-Charset", charset);
        connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=" + charset);
        OutputStream output = null;

        try {
             output = connection.getOutputStream()
             output.write(query.getBytes(charset))
             InputStream response = connection.getInputStream()
        } finally {
             if (output != null) try { output.close(); } catch (IOException logOrIgnore) {}
        }
    }
}
</pre>
