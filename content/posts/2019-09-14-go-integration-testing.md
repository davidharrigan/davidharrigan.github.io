+++
title = "Integration Testing with Golang"
description = "How to create integration tests with Golang"
tags = [ "go", "development", "testing"]
date = "2019-09-14"
categories = [ "development", "go", "testing"]
aliases = ["/blog/integration-testing-with-golang/"]
+++

At my previous job, I came to appreciate the importance of integration
testing. Not only does it give us confidence (especially when we’re on-call),
but it continuously verified that our services were functional through
automated runs from Jenkins.

Two of the primary languages used at the time were Go and Python. Although
the majority of our services were written in Go, most of our API tests were
written in Python. Writing stand-alone tests is fairly straightforward in
Python. At the simplest level, you just need a single file that sets up
tests, uses `requests` to make calls, and assert the responses.

I wanted to know a way to do something similar in Go.

## Goals

- Easy to write and leverages the standard `testing` package.
- Test setup function that configures dependencies, such as
client config to call services in the desired environment (local, staging,
production, etc).
- Standalone tests that are isolated from unit tests. This is either a plus
or minus depending on who you ask, I still don't know the answer 😅. I like
to think that this is a plus. Integration tests should ideally treat the
target service as a black-box and simply expect some output. There are other
reasons as well that we will get to in this post.
- A binary can be produced that can run from CI/CD.

## Setup

To easily verify my goals, I created a very simple gRPC service that
I can run against. There are two endpoints - `Ping` and `StreamPing`. Calling
`Ping` simply replies with (you guessed it!) a `pong` message. `StreamPing`
is similar, but you can specify how many times it `pong`'s back.

```protobuf
syntax = "proto3";

package ping;

option go_package = "protos";

service Pinger {
    rpc Ping(PingRequest) returns (PingResponse) {}
    rpc PingStream (PingRequest) returns (stream PingResponse) {}
}

message PingRequest {
    int32 count = 1;
}


message PingResponse {
    bytes payload = 1;
}
```

I wrote a unit test, and I also added a top-level `testing` package where I intend to store isolated tests.  In the end, I ended on the following structure:

```
├── Makefile
├── go.mod
├── go.sum
├── grpc
│   └── protos
│       ├── ping.pb.go
│       └── ping.proto
├── service
│   ├── main.go
│   └── pinger
│       ├── pinger.go
│       └── pinger_test.go
└── testing
    ├── config
    │   └── config.go
    └── integration
        └── pinger
            ├── integration_test.go
            └── main_test.go
```

## Using the build tag
Go allows you to specify build tags to consider during a build. This concept
also applies to tests. This means that one way to separate unit tests from
more time-consuming tests such as integration tests is to mark these files
with the appropriate build tag to skip them altogether.

My `integration_test.go` file has a build tag of:
```go
// +build integration

package pinger
```

This allows us to skip tests in that file when I just want to run unit tests
in our project.

## Using `TestMain`
`TestMain` allows us to set up the necessary setup and teardown for our test
cases. This is precisely what we need to set up our clients and dependencies
needed for running integration tests against any environment.

Note that this must be placed in the same package as to where our integration
tests live. This is the other reason why in this case, it is better to have a
dedicated package for integration tests. The alternative is to have an `init()`
func or have multiple `TestMain` for all packages with the `+build integration`
build flag, which did not appeal to me.

We can also read from `flag` from `TestMain`. This allowed me to set up flags
that can be specified from the command line to specify my server address and
port. All of the configuration values were then saved to variables under the
`config` package. I also added another flag, `integrationLocal`. If this flag
is specified, it runs the server from the test, meaning I can quickly verify
my service is working without having to spin up an entire local environment.
We could take this a little further and inject mocks for other services that
it depends on so that it can run without any dependencies.

In the end, this is what my `main_test.go` file ended looking like.

```go
// +build integration

package pinger

import (
	"flag"
	"log"
	"os"
	"testing"

	"github.com/davidharrigan/pinger/testing/config"
)

var integrationLocal = flag.Bool("integration-local", false, "spin up a local instance of pinger within the test")
var pingerAddress = flag.String("pinger-address", "localhost", "pinger address")
var pingerPort = flag.Int("pinger-port", 50051, "pinger port")

func TestMain(m *testing.M) {
	flag.Parse()

	if *integrationLocal {
		go func() {
			s := config.Pinger()
			defer s.Stop()
		}()
	} else {
		log.Println(">>> running in integration mode")
		config.PingerConfig = config.ServerConfig{
			Address: *pingerAddress,
			Port:    *pingerPort,
		}
	}

	os.Exit(m.Run())
}
```

## Writing integration tests
Now we have all the pieces needed to use the standard `testing.T` to write
our integration tests. The only extra step we need is to read the client
configuration from our `config` package, but otherwise, it is as simple as
writing any other Golang tests.

```go
// +build integration

package pinger

import (
	"context"
	"fmt"
	"io"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"

	pb "github.com/davidharrigan/pinger/grpc/protos"
	"github.com/davidharrigan/pinger/testing/config"
)

func address() string {
	return fmt.Sprintf("%s:%d", config.PingerConfig.Address, config.PingerConfig.Port)
}

func TestPinger(t *testing.T) {

	type expectation struct {
		out *pb.PingResponse
		err error
	}

	tcs := map[string]struct {
		in       *pb.PingRequest
		expected expectation
	}{
		"ok": {
			in: &pb.PingRequest{},
			expected: expectation{
				out: &pb.PingResponse{
					Payload: []byte(`pong`),
				},
			},
		},
	}

	for scenario, tc := range tcs {
		t.Run(scenario, func(t *testing.T) {
			assert := assert.New(t)

			conn, err := grpc.Dial(address(), grpc.WithInsecure())
			assert.Nil(err)
			defer conn.Close()

			c := pb.NewPingerClient(conn)
			ctx, cancel := context.WithTimeout(context.Background(), time.Second)
			defer cancel()

			out, err := c.Ping(ctx, tc.in)
			assert.Nil(err)

			if tc.expected.err == nil {
				assert.Nil(err)
				assert.Equal(tc.expected.out, out)
			} else {
				assert.Nil(out)
				assert.Equal(tc.expected.err, err)
			}
		})
	}
}
```

## Compiling the test binary
Now, the only thing left for us to do is produce a binary of integration
tests. We can specify the `-c` flag from `go test` to compile the test binary
without running it:

```bash
go test -tags integration -c ./testing/integration/...
```

This is another case why having integration tests isolated works out well.
Our binary only contains the integration tests.

## Conclusion
I hope you found this writeup useful. I believe we managed to accomplish all
the goals I proposed in the beginning. I would love to know other approaches
that are out there that accomplishes something similar or any drawbacks to
the one I presented here. If you would like the see the full source of this
testing setup, you can check it out [here](https://github.com/davidharrigan/pinger).